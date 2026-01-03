import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { party, slot } from '../src/lib/server/db/schema.js';
import { sql } from 'drizzle-orm';
import 'dotenv/config';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('DATABASE_URL 未設定');
  process.exit(1);
}

const client = postgres(DATABASE_URL);
const db = drizzle(client, { schema: { party, slot } });

async function refresh() {
  try {
    console.log('查詢所有非測試團隊...');
    const rows = await db.execute(sql`select id from party where id not like 'test-party-%' order by created_at desc`);
    const existingIds = rows.map((r: any) => r.id);
    console.log(`目前有 ${existingIds.length} 個非測試團隊`);

    // 需要建立的數量
    const need = Math.max(0, 10 - existingIds.length);
    const createdIds: string[] = [];
    if (need > 0) {
      console.log(`需要建立 ${need} 個新團隊以達到總數 10`);
      for (let k = 0; k < need; k++) {
        try {
          const res = await db.insert(party).values({
            name: `團隊`,
            raid_mode: 1,
            run_type: 1,
            owner_id: 1,
            status: 'recruiting',
            is_locked: false,
            gear_limit: 0,
            max_players: 10,
            current_players: 0,
            note: null,
            created_at: sql`now()`,
            updated_at: sql`now()`
          }).returning();
          if (res && res.length > 0) {
            createdIds.push(res[0].id);
            console.log(`建立新團隊 ${res[0].id}`);
          }
        } catch (e) {
          console.warn('建立新團隊失敗', e);
        }
      }
    }

    // 重新讀取所有非測試團隊並取最新 10 筆（依建立時間）
    const allRows = await db.execute(sql`select id from party where id not like 'test-party-%' order by created_at desc limit 10`);
    const ids = allRows.map((r: any) => r.id).reverse();
    console.log(`將更新並編號以下 ${ids.length} 個團隊（從 1 到 ${ids.length}）`);

    for (let i = 0; i < ids.length; i++) {
      const id = ids[i];
      const name = `團隊 ${i + 1}`;
      console.log(`更新 party ${id} 名稱為 "${name}"`);
      await db.update(party).set({ name, updated_at: sql`now()` }).where(sql`id = ${id}`);

      console.log(`刪除 ${id} 的舊 slots`);
      await db.delete(slot).where(sql`raid_id = ${id}`);

      console.log(`建立 10 個預設 slots for ${id}`);
      const slotsData: any[] = Array.from({ length: 10 }).map((_, j) => {
        let position = 'dps';
        if (j < 2) position = 'tank';
        else if (j < 4) position = 'heal';
        return {
          id: `${id}-slot-${String(j).padStart(2, '0')}`,
          raid_id: id,
          slot_order: j,
          position_type: position,
          user_id: null,
          display_name: null,
          gear_score: 0,
          status: 'open',
          pinned: false,
          role: '',
          updated_at: sql`now()`
        };
      });

      await db.insert(slot).values(slotsData).onConflictDoNothing().returning();
      console.log(`已為 ${id} 建立 ${slotsData.length} 個 slots`);
    }

    console.log('刷新完成，總數已調整為最多 10 個（非測試）團隊）');
  } catch (err) {
    console.error('刷新失敗', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

refresh();
