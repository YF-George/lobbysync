import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { verifyAuth, mapAuthUserToDbUserId } from '$lib/server/auth';
import { db } from '$lib/server/db';
import { user, admin } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export const GET: RequestHandler = async ({ request }) => {
  const authHeader = request.headers.get('Authorization');
  const { user: authUser, error } = await verifyAuth(authHeader);

  if (error || !authUser) {
    return json({ is_admin: false, user_id: null }, { status: 401 });
  }

  try {
    // 將 Supabase auth UUID 映射到 local DB user.id
    const userId = await mapAuthUserToDbUserId(authUser.id);

    // 檢查 user 表的 is_admin 欄位
    const userRow = await db.select({ is_admin: user.is_admin })
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);

    let isAdmin = false;
    if (userRow.length > 0 && userRow[0].is_admin) {
      isAdmin = true;
    } else {
      // 或檢查 admin 表（額外的管理員清單）
      const adminRow = await db.select({ id: admin.id })
        .from(admin)
        .where(eq(admin.user_id, userId))
        .limit(1);
      isAdmin = adminRow.length > 0;
    }

    return json({ is_admin: isAdmin, user_id: userId });
  } catch (err) {
    console.error('Admin check error:', err);
    return json({ is_admin: false, user_id: null }, { status: 500 });
  }
};
