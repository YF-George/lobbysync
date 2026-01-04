import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { party, slot } from '$lib/server/db/schema';
import { desc, inArray } from 'drizzle-orm';

export const GET: RequestHandler = async () => {
	try {
		// 获取所有派对，按创建时间倒序
		const parties = await db.select().from(party).orderBy(desc(party.created_at)).limit(100);

		// 使用單一查詢抓取所有 slot，避免 N+1 查詢
		const partyIds = parties.map((p) => p.id);
		const slots = partyIds.length
			? await db
					.select()
					.from(slot)
					.where(inArray(slot.raid_id, partyIds))
					.orderBy(slot.slot_order)
			: [];

		const slotsByParty = new Map<string, typeof slots[number][]>();
		for (const s of slots) {
			const arr = slotsByParty.get(s.raid_id) ?? [];
			arr.push(s);
			slotsByParty.set(s.raid_id, arr);
		}

		const partiesWithMembers = parties.map((p) => ({
			...p,
			members: (slotsByParty.get(p.id) ?? []).map((s) => ({
				id: s.id,
				name: s.display_name || '(空)',
				position: s.position_type,
				gearScore: s.gear_score
			}))
		}));

		return json({
			success: true,
			parties: partiesWithMembers
		});
	} catch (error) {
		// 更詳細的日誌以便部署端能取得 stack trace
		console.error('Failed to fetch parties:', error instanceof Error ? error.message : error);
		if (error instanceof Error && error.stack) console.error(error.stack);
		// 回傳可用於前端顯示的錯誤訊息；詳細 stack 已寫入伺服器日誌
		return json({ success: false, error: error instanceof Error ? error.message : 'Failed to fetch parties' }, { status: 500 });
	}
};
