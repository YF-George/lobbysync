import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { party, slot } from '$lib/server/db/schema';
import { eq, sql } from 'drizzle-orm';
import { verifyAuth } from '$lib/server/auth';
import { supabaseAdmin } from '$lib/server/supabase';
import { admin as adminTable } from '$lib/server/db/schema';
import { and } from 'drizzle-orm';

export async function GET({ params }) {
  const id = params.id;
  try {
    // 使用 Drizzle 的 sql 輔助函數執行原生 SQL 查詢
    const q = sql`select id, name, raid_mode, run_type, start_at, owner_id, status, is_locked, locked_by, locked_at, discord_webhook, gear_limit, max_players, current_players, note, updated_at, created_at from party where id = ${id}`;
    const rows = await db.execute(q);
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

export async function PATCH({ params, request }) {
  const id = params.id;
  
  try {
    // 驗證身份
    const authHeader = request.headers.get('Authorization');
    const { user: authUser, error: authError } = await verifyAuth(authHeader);
    if (authError || !authUser) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 取得 local user id 並檢查權限（owner or admin）
    const { mapAuthUserToDbUserId } = await import('$lib/server/auth');
    let localUserId: number | null = null;
    try {
      localUserId = await mapAuthUserToDbUserId(authUser.id);
    } catch (e) {
      // 無法對應 user，無權限編輯
    }

    const partyRows = await db.select({ owner: party.owner_id }).from(party).where(eq(party.id, id));
    if (!partyRows || partyRows.length === 0) return json({ error: 'Party not found' }, { status: 404 });
    const ownerId = partyRows[0].owner;

    // 移除 admin/owner 限制：任何已驗證使用者皆可編輯（開發環境簡化權限）
    // 生產環境如需限制請改回 owner 或 admin 檢查

    // 獲取更新資料
    const updates = await request.json();
    
    // 可更新的欄位白名單
    const allowedFields = [
      'name', 'raid_mode', 'run_type', 'start_at', 'status', 
      'gear_limit', 'max_players', 'note', 'discord_webhook', 'level_slot'
    ];
    
    const updateData: any = {};
    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        updateData[field] = updates[field];
      }
    }

    // 數值欄位強制轉型，避免字串或 NaN 導致寫入失敗
    if (updateData.raid_mode !== undefined) {
      const v = Number(updateData.raid_mode);
      if (!Number.isFinite(v)) return json({ error: 'Invalid raid_mode' }, { status: 400 });
      updateData.raid_mode = Math.trunc(v);
    }

    if (updateData.run_type !== undefined) {
      const v = Number(updateData.run_type);
      if (!Number.isFinite(v)) return json({ error: 'Invalid run_type' }, { status: 400 });
      updateData.run_type = Math.trunc(v);
    }

    if (updateData.gear_limit !== undefined) {
      const v = Number(updateData.gear_limit);
      if (!Number.isFinite(v)) return json({ error: 'Invalid gear_limit' }, { status: 400 });
      updateData.gear_limit = Math.trunc(v);
    }

    if (updateData.level_slot !== undefined) {
      const v = Number(updateData.level_slot);
      if (!Number.isFinite(v)) return json({ error: 'Invalid level_slot' }, { status: 400 });
      updateData.level_slot = Math.trunc(v);
    }
    
    // 如果沒有任何欄位需要更新
    if (Object.keys(updateData).length === 0) {
      return json({ error: 'No valid fields to update' }, { status: 400 });
    }
    
    // 更新 updated_at
    updateData.updated_at = sql`now()`;
    
    // 執行更新
    const result = await db
      .update(party)
      .set(updateData)
      .where(eq(party.id, id))
      .returning();
    
    if (result.length === 0) {
      return json({ error: 'Party not found' }, { status: 404 });
    }

    // 廣播 party 更新，確保其他用戶即時同步
    try {
      const channel = supabaseAdmin.channel(`party:${id}`);
      await channel.subscribe();
      await channel.send({ type: 'broadcast', event: 'party_updated', payload: result[0] });
      await channel.unsubscribe();
    } catch (broadcastErr) {
      console.error('Failed to broadcast party update:', broadcastErr);
    }

    return json({ success: true, party: result[0] });
  } catch (err: any) {
    console.error('Error in PATCH /api/party/[id]:', {
      message: err?.message ?? String(err),
      code: err?.code,
      stack: err?.stack
    });
    return json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE({ params, request }) {
  const id = params.id;
  try {
    const authHeader = request.headers.get('Authorization');
    const { user: authUser, error: authError } = await verifyAuth(authHeader);
    if (authError || !authUser) return json({ error: 'Unauthorized' }, { status: 401 });

    // map to local user id
    const { mapAuthUserToDbUserId } = await import('$lib/server/auth');
    let localUserId: number | null = null;
    try {
      localUserId = await mapAuthUserToDbUserId(authUser.id);
    } catch (e) {
      console.error('Failed to map auth user to db user:', e);
    }

    // check owner or admin
    const rows = await db.select({ owner: party.owner_id }).from(party).where(eq(party.id, id));
    if (!rows || rows.length === 0) return json({ error: 'Party not found' }, { status: 404 });
    const ownerId = rows[0].owner;

    let isAdmin = false;
    if (localUserId) {
      const adminRows = await db.select().from(adminTable).where(eq(adminTable.user_id, localUserId));
      isAdmin = adminRows.length > 0;
    }

    // Log permission check for debugging
    console.log(`DELETE /api/party/${id}: authUser=${authUser.id}, localUserId=${localUserId}, ownerId=${ownerId}, isAdmin=${isAdmin}`);

    // 只要是認證用戶就允許刪除（簡化版本，生產環境應該更嚴格）
    // if (!isAdmin && localUserId !== ownerId) {
    //   return json({ error: 'Forbidden - Not owner or admin' }, { status: 403 });
    // }

    // delete slots first
    await db.delete(slot).where(eq(slot.raid_id, id));

    // delete party
    await db.delete(party).where(eq(party.id, id));

    return json({ success: true });
  } catch (err: any) {
    console.error('Error in DELETE /api/party/[id]:', {
      message: err?.message ?? String(err),
      code: err?.code,
      stack: err?.stack
    });
    return json({ error: 'Internal server error' }, { status: 500 });
  }
}
