import { json } from '@sveltejs/kit';
import { db, pgClient } from '$lib/server/db';
import { party, slot } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export async function GET({ params }) {
  const id = params.id;
  try {
    // 嘗試使用原生 pgClient 執行相同查詢以捕捉更完整的 DB 錯誤資訊
    const q = `select id, name, raid_mode, run_type, start_at, owner_id, status, is_locked, locked_by, locked_at, discord_webhook, gear_limit, max_players, current_players, note, updated_at, created_at from party where id = $1`;
    const rows = await pgClient.query(q, [id]);
    if (!rows || rows.length === 0) return json({ error: 'not found' }, { status: 404 });
    const p = rows[0];

    const slots = await db.select().from(slot).where(eq(slot.raid_id, id)).orderBy(slot.slot_order);
    return json({ party: p, slots });
  } catch (err: any) {
    // 寫入更完整錯誤到 server logs（包括 message 與 stack），便於在 Zeabur 上診斷
    console.error('Error in GET /api/party/[id]:', {
      message: err?.message ?? String(err),
      code: err?.code,
      stack: err?.stack
    });
    return json({ error: 'internal server error' }, { status: 500 });
  }
}
