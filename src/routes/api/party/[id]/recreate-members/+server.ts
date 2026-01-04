import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { changelog, slot, party } from '$lib/server/db/schema';
import { eq, desc } from 'drizzle-orm';
import { sql } from 'drizzle-orm';
import { verifyAuth } from '$lib/server/auth';
import { supabaseAdmin } from '$lib/server/supabase';

// POST /api/party/[id]/recreate-members
// 從 changelog 取出最近的 slot 變更紀錄並嘗試還原至 slot
export const POST: RequestHandler = async ({ params, request }) => {
	const partyId = params.id;

	// 驗證身分（允許匿名，但驗證可用時仍會執行）
	const authHeader = request.headers.get('authorization');
	const { user: _authUser } = await verifyAuth(authHeader);

	try {
		// 確認是否存在 slot rows；若全部刪除，先建立預設 10 個空位
		const existingSlots = await db.select().from(slot).where(eq(slot.raid_id, partyId));
		if (!existingSlots || existingSlots.length === 0) {
			const createdSlots = Array.from({ length: 10 }, (_, idx) => {
				const id = `slot-${partyId}-${String(idx).padStart(2, '0')}`;
				const pos = idx < 2 ? 'tank' : idx < 4 ? 'heal' : 'dps';
				return {
					id,
					raid_id: partyId,
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

			try {
				await db.insert(slot).values(createdSlots).returning();
			} catch (e) {
				console.warn('Failed to create default slots during recreate-members:', e);
			}
		}

		// 取得最近的 changelog，針對 target_type = 'slot' 的更新
		const logs = await db
			.select()
			.from(changelog)
			.where(eq(changelog.party_id, partyId))
			.orderBy(desc(changelog.created_at))
			.limit(1000);

		if (!logs || logs.length === 0) {
			return json({ ok: false, message: 'No changelog entries found' }, { status: 404 });
		}

		// 將 log 依 slot id 聚合，採用最新的 new_value
		const slotMap: Record<string, { user_id?: number | null; display_name?: string | null }> = {};

		for (const log of logs) {
			try {
				const target = log.target_id;
				if (!target) continue;

				// 我們只處理 target_type === 'slot' 或看起來像 slot id 的項目
				if (log.target_type && log.target_type !== 'slot') continue;

				// 若 field 指向 user_id 或 display_name，使用 new_value 還原
				const field = log.field;
				const newVal = log.new_value;

				if (!slotMap[target]) slotMap[target] = {};

				if (field === 'user_id') {
					const parsed = newVal === null || newVal === 'null' ? null : Number(newVal);
					slotMap[target].user_id = Number.isFinite(parsed) ? parsed : null;
				} else if (field === 'display_name') {
					slotMap[target].display_name = newVal ?? null;
				} else if (!field && log.action === 'pin') {
					// 有些舊紀錄可能將 actor_name 放在 actor_name 或 details 中
					// 嘗試從 details 或 actor_name 補 display_name
					if (log.actor_name) slotMap[target].display_name = log.actor_name;
				}
			} catch (_e) {
				// 忽略單筆 log 解析錯誤
				continue;
			}
		}

		const slotIds = Object.keys(slotMap);
		if (slotIds.length === 0) {
			return json(
				{ ok: false, message: 'No slot-related changelog entries to restore' },
				{ status: 400 }
			);
		}

		// 執行更新並收集變更結果
		const updated: string[] = [];
		for (const sId of slotIds) {
			const changes: any = {};
			if ('user_id' in slotMap[sId]) changes.user_id = slotMap[sId].user_id;
			if ('display_name' in slotMap[sId]) changes.display_name = slotMap[sId].display_name;
			if (Object.keys(changes).length === 0) continue;

			await db.update(slot).set(changes).where(eq(slot.id, sId));
			updated.push(sId);
		}

		// Broadcast aggregated updated slots to clients (single event)
		try {
			const partyExists = await db.select().from(party).where(eq(party.id, partyId)).limit(1);
			if (partyExists && partyExists.length > 0 && updated.length > 0) {
				const rows = await db
					.select()
					.from(slot)
					.where(sql`id = ANY(${updated})`);
				const channel = supabaseAdmin.channel(`party:${partyId}`);
				await channel.subscribe();
				await channel.send({
					type: 'broadcast',
					event: 'party_and_slots_updated',
					payload: { party: partyExists[0], slots: rows }
				});
				await channel.unsubscribe();
			}
		} catch (bErr) {
			console.warn('Broadcast error in recreate-members:', bErr);
		}

		return json({ ok: true, restored: updated.length, slots: updated });
	} catch (err: any) {
		console.error('Failed to recreate members from changelog:', err);
		return json({ ok: false, error: String(err) }, { status: 500 });
	}
};
