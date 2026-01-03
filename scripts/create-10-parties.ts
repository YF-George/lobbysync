// 建立 10 個自動派對（非 test-party）
// 執行：npx tsx scripts/create-10-parties.ts

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { party, slot } from '../src/lib/server/db/schema.js';
import { sql } from 'drizzle-orm';
import 'dotenv/config';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL 未設定，請檢查 .env 檔案');
  process.exit(1);
}

const client = postgres(DATABASE_URL);
const db = drizzle(client, { schema: { party, slot } });

async function createParties() {
  console.log('🌱 開始建立 10 個自動派對...');
  try {
    await db.execute(sql`CREATE EXTENSION IF NOT EXISTS pgcrypto`);

    for (let i = 1; i <= 10; i++) {
      const id = `party-${String(i).padStart(3, '0')}`;
      const name = `團隊 ${i}`;

      const [created] = await db
        .insert(party)
        .values({
          id,
          name,
          owner_id: 1,
          raid_mode: 1,
          run_type: 1,
          status: 'recruiting',
          gear_limit: 650,
          max_players: 10,
          current_players: 0,
          note: null,
          created_at: sql`now()`,
          updated_at: sql`now()`
        })
        .onConflictDoNothing()
        .returning();

      if (created) console.log(`✓ 建立 party: ${id}`);
      else console.log(`ℹ party ${id} 已存在，跳過`);

      // 建立 slots（若尚未建立）
      const existingSlots = await db.select().from(slot).where(sql`raid_id = ${id}`);
      if (existingSlots.length === 0) {
        const slotsData = Array.from({ length: 10 }).map((_, j) => {
          let positionType = 'dps';
          if (j < 2) positionType = 'tank';
          else if (j < 4) positionType = 'heal';

          return {
            id: `slot-${id}-${String(j).padStart(2, '0')}`,
            raid_id: id,
            slot_order: j,
            position_type: positionType,
            status: 'open',
            gear_score: 0,
            display_name: null,
            user_id: null,
            updated_at: sql`now()`
          };
        });

        const inserted = await db.insert(slot).values(slotsData).onConflictDoNothing().returning();
        console.log(`✓ 為 ${id} 建立 ${inserted.length} 個 slots`);
      } else {
        console.log(`ℹ ${id} 已有 slots，跳過建立`);
      }
    }

    console.log('\n✅ 完成：已建立 10 個自動派對（若已存在則跳過）');
  } catch (err) {
    console.error('❌ 建立失敗：', err);
  } finally {
    await client.end();
    process.exit(0);
  }
}

createParties();
