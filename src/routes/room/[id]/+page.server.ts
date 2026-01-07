import { db } from '$lib/server/db';
import { rooms } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { error } from '@sveltejs/kit';

export const load = async ({ params, locals }) => {
  // 1. 取得用戶資訊 (如果專案使用 Lucia，locals.auth 應存在)
  const session = typeof (locals as any)?.auth === 'function' ? await (locals as any).auth() : null;
  if (!session) throw error(401, '未登入');

  // 2. 從資料庫抓取房間資料與 JSON 快照
  const rows = await db.select().from(rooms).where(eq(rooms.id, params.id));
  const roomData = rows[0];
  if (!roomData) throw error(404, '找不到房間');

  return {
    room: roomData,
    user: session.user
  };
};
