import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { party, slot } from '$lib/server/db/schema';
import { desc, eq } from 'drizzle-orm';

export const GET: RequestHandler = async () => {
	try {
		// 获取所有派对，按创建时间倒序
		const parties = await db
			.select()
			.from(party)
			.orderBy(desc(party.created_at))
			.limit(100);

		// 为每个派对获取其成员信息
		const partiesWithMembers = await Promise.all(
			parties.map(async (p) => {
				const slots = await db
					.select()
					.from(slot)
					.where(eq(slot.raid_id, p.id))
					.orderBy(slot.slot_order);

				return {
					...p,
					members: slots.map((s) => ({
						id: s.id,
						name: s.display_name || '(空)',
						position: s.position_type,
						gearScore: s.gear_score
					}))
				};
			})
		);

		return json({
			success: true,
			parties: partiesWithMembers
		});
	} catch (error) {
		console.error('Failed to fetch parties:', error);
		return json(
			{ success: false, error: 'Failed to fetch parties' },
			{ status: 500 }
		);
	}
};
