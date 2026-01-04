// Server-side Auth helper
// 用途：驗證 Supabase JWT token 並取得使用者資訊

import { supabaseAdmin } from './supabase';
import { db } from './db';
import { user } from './db/schema';
import { eq } from 'drizzle-orm';

/**
 * 從 Authorization header 驗證 JWT 並回傳 user
 * @param authHeader - 'Bearer <token>' 格式的 header 值
 * @returns { user, error } - 成功回傳 user，失敗回傳 error
 */
export async function verifyAuth(authHeader: string | null) {
	// 改為允許未提供 Authorization header 的情況
	// 若沒有提供 token 或 token 無效，回傳一個「匿名」使用者物件，讓後端 API 繼續以匿名使用者身分運作。
	// 這樣可以在不大幅改動各個 endpoint 的情況下，移除強制登入檢查。
	const ANON_ID = '00000000-0000-0000-0000-000000000000';

	if (!authHeader || !authHeader.startsWith('Bearer ')) {
		return {
			user: { id: ANON_ID, email: 'anonymous@local' } as any,
			error: null
		};
	}

	const token = authHeader.substring(7);

	try {
		const { data, error } = await supabaseAdmin.auth.getUser(token);
		if (error || !data.user) {
			return {
				user: { id: ANON_ID, email: 'anonymous@local' } as any,
				error: null
			};
		}
		return { user: data.user, error: null };
	} catch (_err) {
		return {
			user: { id: ANON_ID, email: 'anonymous@local' } as any,
			error: null
		};
	}
}

/**
 * 從 user.id (UUID) 對應到我們 DB 的 user.id (integer)
 * 注意：目前 schema 使用 integer user_id，但 Supabase Auth 使用 UUID
 *
 * 臨時方案：用 hash 或固定映射；正式方案應改 schema 為 UUID 或建立對應表
 */
export async function mapAuthUserToDbUserId(authUserId: string): Promise<number> {
	// 透過 user.auth_id 查表對應；若不存在則建立新 user（保留 integer id）
	const rows = await db.select({ id: user.id }).from(user).where(eq(user.auth_id, authUserId));
	if (rows.length > 0) return rows[0].id;

	// 建立新 user，僅指定 auth_id，其他欄位留空或預設
	const inserted = await db.insert(user).values({ auth_id: authUserId }).returning({ id: user.id });
	return inserted[0].id;
}
