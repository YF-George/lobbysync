import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { kicked, admin as adminTable } from '$lib/server/db/schema';
import { verifyAuth, mapAuthUserToDbUserId } from '$lib/server/auth';
import { eq } from 'drizzle-orm';

// 管理員踢人 API
export async function POST({ request }) {
	try {
		const authHeader = request.headers.get('Authorization');
		const { user: authUser, error: authError } = await verifyAuth(authHeader);
		
		if (authError || !authUser) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}
		
		// 驗證是否為管理員
		const localUserId = await mapAuthUserToDbUserId(authUser.id);
		const adminRows = await db.select().from(adminTable).where(eq(adminTable.user_id, localUserId));
		
		if (adminRows.length === 0) {
			return json({ error: 'Forbidden: Admin only' }, { status: 403 });
		}
		
		const body = await request.json();
		const { party_id, user_auth_id, reason } = body;
		
		if (!party_id || !user_auth_id) {
			return json({ error: 'Missing required fields' }, { status: 400 });
		}
		
		// 記錄踢人事件
		const [kickRecord] = await db
			.insert(kicked)
			.values({
				party_id,
				user_auth_id,
				kicked_by: localUserId,
				reason: reason || '違反使用規範'
			})
			.returning();
		
		return json({ success: true, kick: kickRecord }, { status: 201 });
	} catch (err: any) {
		console.error('Error in kick API:', err);
		return json({ error: 'Internal error' }, { status: 500 });
	}
}

// 檢查用戶是否被踢出
export async function GET({ url, request }) {
	try {
		const authHeader = request.headers.get('Authorization');
		const { user, error } = await verifyAuth(authHeader);
		
		if (error || !user) {
			return json({ kicked: false });
		}
		
		const partyId = url.searchParams.get('party_id');
		if (!partyId) {
			return json({ error: 'Missing party_id' }, { status: 400 });
		}
		
		// 檢查是否被踢出
		const kickRecords = await db
			.select()
			.from(kicked)
			.where(eq(kicked.user_auth_id, user.id))
			.limit(1);
		
		return json({ kicked: kickRecords.length > 0, records: kickRecords });
	} catch (err: any) {
		console.error('Error checking kick status:', err);
		return json({ error: 'Internal error' }, { status: 500 });
	}
}
