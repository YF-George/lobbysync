import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { party, slot } from '$lib/server/db/schema';
import { sql, eq } from 'drizzle-orm';
import { supabaseAdmin } from '$lib/server/supabase';

// POST /api/repair-slots
// 為所有非 test-party- 範本的 party 確保每個有 10 個 slot；缺則建立
export const POST: RequestHandler = async () => {
	try {
		// 取得最多 10 個非測試的 party（若需要可擴充成指定數量）
		const parties = await db
			.select()
			.from(party)
			.where(sql`id NOT LIKE 'test-party-%'`)
			.orderBy(party.created_at)
			.limit(10);

		if (!parties || parties.length === 0)
			return json({ ok: false, message: 'No parties found' }, { status: 404 });

		const createdSlots: string[] = [];

		for (const p of parties) {
			const pId = p.id;
			// 取得現有 slot 數量與 id 列表
			const existing = await db.select().from(slot).where(eq(slot.raid_id, pId));
			const existingIds = new Set((existing || []).map((s: any) => s.slot_order));

			const toCreate: any[] = [];
			for (let i = 0; i < 10; i++) {
				if (!existingIds.has(i)) {
					const id = `slot-${pId}-${String(i).padStart(2, '0')}`;
					const pos = i < 2 ? 'tank' : i < 4 ? 'heal' : 'dps';
					toCreate.push({
						id,
						raid_id: pId,
						slot_order: i,
						position_type: pos,
						user_id: null,
						display_name: null,
						gear_score: 0,
						status: 'open',
						pinned: false,
						role: '',
						updated_at: sql`now()`
					});
					createdSlots.push(id);
				}
			}

			if (toCreate.length > 0) {
				await db.insert(slot).values(toCreate).returning();

				// broadcast created slots as a single aggregated event per party
				try {
					const channel = supabaseAdmin.channel(`party:${pId}`);
					await channel.subscribe();
					await channel.send({
						type: 'broadcast',
						event: 'party_and_slots_updated',
						payload: { partyId: pId, slots: toCreate }
					});
					await channel.unsubscribe();
				} catch (bErr) {
					console.warn('Broadcast error in repair-slots:', bErr);
				}
			}
		}

		return json({ ok: true, created: createdSlots.length, slots: createdSlots });
	} catch (err: any) {
		console.error('repair-slots failed', err);
		return json({ ok: false, error: String(err) }, { status: 500 });
	}
};
