import { json } from '@sveltejs/kit';
import { verifyAuth, mapAuthUserToDbUserId } from '$lib/server/auth';
import { db } from '$lib/server/db';
import { party, slot } from '$lib/server/db/schema';
import { sql } from 'drizzle-orm';

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

			return json({ ok: true, reset: existing.length });
		}

		// If no existing parties, create 10 default parties (same as previous behavior)
		const createdIds: string[] = [];
		for (let i = 1; i <= 10; i++) {
			const [created] = await db
				.insert(party)
				.values({
					name: `團隊 ${i}`,
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
