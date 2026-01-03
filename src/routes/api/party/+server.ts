import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { party, slot } from '$lib/server/db/schema';
import { verifyAuth, mapAuthUserToDbUserId } from '$lib/server/auth';
import { sql } from 'drizzle-orm';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const authHeader = request.headers.get('Authorization');
		let ownerId = 1; // default owner

		// 若有 token，嘗試映射為本地 user id
		if (authHeader) {
			const { user, error } = await verifyAuth(authHeader);
			if (!error && user?.id) {
				try {
					ownerId = await mapAuthUserToDbUserId(user.id);
				} catch (e) {
					// fallback to default ownerId
				}
			}
		}

		const body = await request.json().catch(() => ({}));

		const name = body.name || `團隊${String(Date.now()).slice(-4)}`;
		const maxPlayers = body.max_players ?? 10; // 預設 10 人
		const newParty = {
			name,
			raid_mode: body.raid_mode ?? 1,
			run_type: body.run_type ?? 1,
			start_at: body.start_at ?? null,
			owner_id: ownerId,
			status: body.status ?? 'recruiting',
			is_locked: body.is_locked ?? false,
			gear_limit: body.gear_limit ?? 0,
			max_players: maxPlayers,
			current_players: 0,
			note: body.note ?? null,
			created_at: sql`now()`,
			updated_at: sql`now()`
		};

		const inserted = await db.insert(party).values(newParty).returning();
		const createdParty = inserted[0];

		// 建立預設空位 slots（10 人）
		try {
			const slotsData: any[] = Array.from({ length: 10 }).map((_, i) => {
				// 配置：前 2 個坦克、中間 2 個補師、其餘 6 個 DPS
				let position = 'dps';
				if (i < 2) position = 'tank';
				else if (i < 4) position = 'heal';
				return {
					id: `${createdParty.id}-slot-${String(i).padStart(2, '0')}`,
					raid_id: createdParty.id,
					slot_order: i,
					position_type: position,
					user_id: null,
					display_name: null,
					gear_score: 0,
					status: 'open',
					pinned: false,
					role: '',
					updated_at: sql`now()`
				};
			});

			await db.insert(slot).values(slotsData).onConflictDoNothing().returning();
		} catch (e) {
			console.warn('Failed to create default slots for party', createdParty.id, e);
		}

		return json({ party: createdParty }, { status: 201 });
	} catch (err: any) {
		console.error('Error in POST /api/party:', err);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};

export const GET: RequestHandler = async ({ request }) => {
	try {
		// 取得所有副本，按建立時間倒序排列
		const parties = await db.select().from(party).orderBy(party.created_at);

		return json({
			parties,
			count: parties.length
		});
	} catch (error) {
		console.error('Failed to fetch parties:', error);
		return json(
			{
				error: 'Failed to fetch parties',
				message: error instanceof Error ? error.message : 'Unknown error'
			},
			{ status: 500 }
		);
	}
};
