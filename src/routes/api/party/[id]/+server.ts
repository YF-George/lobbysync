import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { party, slot } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export async function GET({ params }) {
  const id = params.id;
  try {
    const rows = await db.select().from(party).where(eq(party.id, id));
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
