// Changelog API - 變更記錄管理
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { changelog } from '$lib/server/db/schema';
import { eq, desc } from 'drizzle-orm';
import { verifyAuth, mapAuthUserToDbUserId } from '$lib/server/auth';

// GET - 獲取派對的變更記錄
export const GET: RequestHandler = async ({ params }) => {
	const party_id = params.party_id;

	try {
		const logs = await db
			.select()
			.from(changelog)
			.where(eq(changelog.party_id, party_id))
			.orderBy(desc(changelog.created_at))
			.limit(100); // 最多返回 100 筆

		return json({ logs });
	} catch (err: any) {
		console.error('Error fetching changelog:', err);
		return json({ error: 'Failed to fetch changelog' }, { status: 500 });
	}
};

// POST - 新增變更記錄
export const POST: RequestHandler = async ({ params, request }) => {
	const party_id = params.party_id;

	try {
		// 驗證身份
		const authHeader = request.headers.get('Authorization');
		const { user: authUser, error: authError } = await verifyAuth(authHeader);
		if (authError || !authUser) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		// 獲取 local user id
		const localUserId = await mapAuthUserToDbUserId(authUser.id);

		const body = await request.json();
		const { actor_name, action, target_type, target_id, field, old_value, new_value, details } =
			body;

		// 插入記錄
		const [log] = await db
			.insert(changelog)
			.values({
				party_id,
				actor_id: localUserId,
				actor_name: actor_name || '未知用戶',
				action: action || 'update',
				target_type: target_type || 'party',
				target_id: target_id || party_id,
				field: field || null,
				old_value: old_value !== undefined ? String(old_value) : null,
				new_value: new_value !== undefined ? String(new_value) : null,
				details: details || '更新資料'
			})
			.returning();

		return json({ log }, { status: 201 });
	} catch (err: any) {
		console.error('Error creating changelog:', err);
		return json({ error: 'Failed to create changelog' }, { status: 500 });
	}
};
