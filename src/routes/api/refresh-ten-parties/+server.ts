import { json } from '@sveltejs/kit';
import { verifyAuth, mapAuthUserToDbUserId } from '$lib/server/auth';
import { db } from '$lib/server/db';
import { party, slot, changelog } from '$lib/server/db/schema';
import { sql, eq, desc } from 'drizzle-orm';
import { supabaseAdmin } from '$lib/server/supabase';

export async function POST({ request }: { request: Request }) {
	const authHeader = request.headers.get('authorization');

	const { user: authUser, error: verifyError } = await verifyAuth(authHeader);
	if (verifyError || !authUser) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const dbUserId = await mapAuthUserToDbUserId(authUser.id);

		// Ensure pgcrypto for UUID defaults without emitting NOTICE when already present
		await db.execute(
			sql`DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pgcrypto') THEN CREATE EXTENSION pgcrypto; END IF; END $$;`
		);

		// Find existing non-test parties
		const existing = await db
			.select()
			.from(party)
			.where(sql`id NOT LIKE 'test-party-%'`);

		if (existing.length > 0) {
			// Reset each existing party to defaults (same as reset script)
			await db.execute(sql`UPDATE party SET
        name = '',
        start_at = NULL,
        raid_mode = 1,
        run_type = 1,
        level_slot = 0,
        status = 'recruiting',
        gear_limit = 0,
        max_players = 10,
        current_players = 0,
        note = NULL,
        is_locked = false,
        locked_by = NULL,
        locked_at = NULL,
        discord_webhook = NULL,
        updated_at = NOW()
        WHERE id NOT LIKE 'test-party-%'`);

			// Reset slots for those parties (keep pinned members)
			await db.execute(sql`UPDATE slot SET
        user_id = NULL,
        display_name = NULL,
        gear_score = 0,
        status = 'open',
        role = '',
        note = NULL,
        updated_at = NOW()
        WHERE raid_id NOT LIKE 'test-party-%' 
        AND (pinned = FALSE OR pinned IS NULL)`);

			// Attempt to restore members from changelog for each party
			async function restoreMembersForParty(pId: string) {
				try {
					// ensure slots exist
					const existingSlots = await db.select().from(slot).where(eq(slot.raid_id, pId));
					if (!existingSlots || existingSlots.length === 0) {
						const createdSlots = Array.from({ length: 10 }, (_, idx) => {
							const id = `slot-${pId}-${String(idx).padStart(2, '0')}`;
							const pos = idx < 2 ? 'tank' : idx < 4 ? 'heal' : 'dps';
							return {
								id,
								raid_id: pId,
								slot_order: idx,
								position_type: pos,
								user_id: null,
								display_name: null,
								gear_score: 0,
								status: 'open',
								pinned: false,
								role: '',
								updated_at: sql`now()`
							};
						});
						await db.insert(slot).values(createdSlots).returning();
					}

					// fetch recent changelog for this party
					const logs = await db
						.select()
						.from(changelog)
						.where(eq(changelog.party_id, pId))
						.orderBy(desc(changelog.created_at))
						.limit(1000);
					if (!logs || logs.length === 0) return;

					const slotMap: Record<string, { user_id?: number | null; display_name?: string | null }> =
						{};
					for (const log of logs) {
						const target = log.target_id;
						if (!target) continue;
						if (log.target_type && log.target_type !== 'slot') continue;
						const field = log.field;
						const newVal = log.new_value;
						if (!slotMap[target]) slotMap[target] = {};
						if (field === 'user_id') {
							const parsed = newVal === null || newVal === 'null' ? null : Number(newVal);
							slotMap[target].user_id = Number.isFinite(parsed) ? parsed : null;
						} else if (field === 'display_name') {
							slotMap[target].display_name = newVal ?? null;
						} else if (!field && log.action === 'pin') {
							if (log.actor_name) slotMap[target].display_name = log.actor_name;
						}
					}

					const slotIds = Object.keys(slotMap);
					if (slotIds.length === 0) return;

					for (const sId of slotIds) {
						const changes: any = {};
						if ('user_id' in slotMap[sId]) changes.user_id = slotMap[sId].user_id;
						if ('display_name' in slotMap[sId]) changes.display_name = slotMap[sId].display_name;
						if (Object.keys(changes).length === 0) continue;
						await db.update(slot).set(changes).where(eq(slot.id, sId));
					}
				} catch (e) {
					console.warn('restoreMembersForParty failed for', pId, e);
				}
			}

			// run restores in sequence for each party
			for (const p of existing) {
				await restoreMembersForParty(p.id);
			}

			// Broadcast updates so clients subscribed via channels receive the changes
			try {
				// fetch updated party rows
				const updatedParties = await db
					.select()
					.from(party)
					.where(sql`id NOT LIKE 'test-party-%'`);
				for (const p of updatedParties) {
					const pId = p.id;
					// fetch updated slots for this party
					const slots = await db
						.select()
						.from(slot)
						.where(eq(slot.raid_id, pId))
						.orderBy(slot.slot_order);

					const channel = supabaseAdmin.channel(`party:${pId}`);
					await channel.subscribe();
					// Broadcast a single aggregated event containing party + slots
					await channel.send({
						type: 'broadcast',
						event: 'party_and_slots_updated',
						payload: { party: p, slots }
					});
					await channel.unsubscribe();
				}
			} catch (bErr) {
				console.warn('Failed to broadcast refresh updates', bErr);
			}

			return json({ ok: true, reset: existing.length });
		}

		// If no existing parties, create 10 default parties
		const createdIds: string[] = [];
		for (let i = 1; i <= 10; i++) {
			const [created] = await db
				.insert(party)
				.values({
					name: '',
					raid_mode: 1,
					run_type: 1,
					owner_id: dbUserId,
					status: 'recruiting',
					gear_limit: 0,
					max_players: 10,
					current_players: 0,
					note: null
				})
				.returning();

			const pId = created.id;
			createdIds.push(pId);

			const slotsData = Array.from({ length: 10 }, (_, idx) => {
				const pos = idx < 2 ? 'tank' : idx < 4 ? 'heal' : 'dps';
				return {
					id: `slot-${pId}-${String(idx).padStart(2, '0')}`,
					raid_id: pId,
					slot_order: idx,
					position_type: pos,
					status: 'open',
					gear_score: 0,
					display_name: null,
					user_id: null,
					pinned: false,
					role: ''
				};
			});

			await db.insert(slot).values(slotsData).returning();
		}

		return json({ ok: true, created: createdIds.length, partyIds: createdIds });
	} catch (err) {
		console.error('refresh-ten-parties failed', err);
		return json({ error: String(err) }, { status: 500 });
	}
}
