import { json } from '@sveltejs/kit';
import { verifyAuth } from '$lib/server/auth';

// 線上用戶 API
// 注意：此端點主要用於初始化，實際線上狀態由 Supabase Realtime Presence 管理

export async function GET({ params: _params, request }) {
	try {
		const authHeader = request.headers.get('Authorization');
		const { user, error } = await verifyAuth(authHeader);

		if (error || !user) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		// 返回當前用戶信息，前端將使用 Supabase Presence API 追蹤線上狀態
		return json({
			user: {
				id: user.id,
				email: user.email
			},
			message: 'Use Supabase Realtime Presence for tracking online users'
		});
	} catch (err: any) {
		console.error('Error in presence API:', err);
		return json({ error: 'Internal error' }, { status: 500 });
	}
}
