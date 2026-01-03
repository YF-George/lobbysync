import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { slot, party } from '$lib/server/db/schema';
import { eq, sql } from 'drizzle-orm';
import { verifyAuth, mapAuthUserToDbUserId } from '$lib/server/auth';

// 說明（台灣用語）：
// - 這支 API 是給「團長 / 有權限的使用者」更新單一 slot 用。
// - 使用 Supabase JWT 驗證（Authorization: Bearer <token>）。
// - 流程：驗證 JWT → 允許欄位白名單 → 交易內鎖定 slot + 讀取 party → 檢查權限 → 更新 → 回傳。
// - 用 transaction 是為了確保讀取與更新的一致性，避免並發造成髒資料。
// - 更新成功後會透過 Supabase Realtime 廣播變更，讓所有觀看者即時同步（目標 <500ms）。

export async function PATCH({ params, request }) {
  const id = params.id;
  const body = await request.json();

  // JWT 驗證：從 Authorization header 取得 token 並驗證
  const authHeader = request.headers.get('authorization');
  const { user, error: authError } = await verifyAuth(authHeader);
  
  if (authError || !user) {
    return json({ error: 'unauthenticated', detail: authError }, { status: 401 });
  }

  // 將 Supabase Auth UUID 映射到 DB 的 integer user_id（透過查表，若不存在則建立）
  const userId = await mapAuthUserToDbUserId(user.id);

  // 欄位白名單 + 基本驗證：避免未預期欄位被覆寫。
	const allowed = ['display_name', 'gear_score', 'position_type', 'status', 'user_id', 'locked_until', 'note', 'tags', 'pinned', 'role'];
  const update: Record<string, any> = {};
  for (const k of allowed) if (k in body) update[k] = body[k];
  if (Object.keys(update).length === 0) return json({ error: 'no updatable fields' }, { status: 400 });

  if ('gear_score' in update) {
    const g = Number(update.gear_score);
    if (!Number.isFinite(g) || g < 0) return json({ error: 'invalid gear_score' }, { status: 400 });
    update.gear_score = Math.floor(g);
  }

  if ('tags' in update) {
    if (!Array.isArray(update.tags)) return json({ error: 'tags must be array' }, { status: 400 });
    const validTags = ['leader', 'substitute', 'alt', 'backup'];
    const filtered = update.tags.filter((t: any) => typeof t === 'string' && validTags.includes(t));
    update.tags = filtered;
  }

  // 交易內執行：確保讀寫一致，並為之後加鎖 / 並發控制預留空間。
  try {
    const result = await db.transaction(async (tx) => {
      // fetch slot and parent party to check permissions
      const slots = await tx.select().from(slot).where(eq(slot.id, id));
      if (!slots || slots.length === 0) return { status: 404, body: { error: 'slot not found' } };
      const s = slots[0];

      const parties = await tx.select().from(party).where(eq(party.id, s.raid_id));
      if (!parties || parties.length === 0) return { status: 404, body: { error: 'parent party not found' } };
      const p = parties[0];

      // 授權策略（放寬）：
      // - 團長可改
      // - 該 slot 已指派的 user 也可改
      // - 若 slot 尚未指派 (user_id 為 null) 也允許填寫/更新
      const isOwner = p.owner_id === userId;
      const isAssignee = s.user_id !== null && s.user_id === userId;
      const isUnassigned = s.user_id === null;
      if (!isOwner && !isAssignee && !isUnassigned) {
        return { status: 403, body: { error: 'forbidden' } };
      }

      update.updated_at = sql`now()`;

      const updated = await tx.update(slot).set(update).where(eq(slot.id, id)).returning();
      if (!updated || updated.length === 0) return { status: 404, body: { error: 'update failed' } };

      return { status: 200, body: { slot: updated[0] } };
    });

    // Database Changes 模式：DB 更新後會自動透過 Postgres WAL 推送給訂閱者
    // 不需手動廣播，更快且更可靠

    return json(result.body, { status: result.status });
  } catch (err) {
    return json({ error: 'internal error', detail: String(err) }, { status: 500 });
  }
}

export async function GET({ params }) {
  const id = params.id;
  const rows = await db.select().from(slot).where(eq(slot.id, id));
  if (!rows || rows.length === 0) return json({ error: 'not found' }, { status: 404 });
  return json({ slot: rows[0] });
}
