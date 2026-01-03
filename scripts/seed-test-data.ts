// 測試數據生成腳本
// 用途：快速建立一個 party 與 10 個 slots 用於測試 Realtime 功能
// 執行：npx tsx scripts/seed-test-data.ts

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { party, slot } from '../src/lib/server/db/schema.js';
import { sql } from 'drizzle-orm';
import 'dotenv/config';

// 直接從 process.env 讀取 DATABASE_URL（避免依賴 SvelteKit 的 $env）
const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL 未設定，請檢查 .env 檔案');
  process.exit(1);
}

const client = postgres(DATABASE_URL);
const db = drizzle(client, { schema: { party, slot } });

async function seedTestData() {
  console.log('🌱 開始建立測試數據...');

  try {
    // 先啟用 pgcrypto extension（若尚未啟用）
    await db.execute(sql`CREATE EXTENSION IF NOT EXISTS pgcrypto`);
    console.log('✓ pgcrypto extension 已啟用');

    // 建立 10 個測試 party，每個 10 個 slots
    const partyCount = 10;
    const slotsPerParty = 10;

    const createdParties: string[] = [];

    for (let p = 1; p <= partyCount; p++) {
      const partyId = `test-party-${String(p).padStart(3, '0')}`;
      const partyName = `測試副本 ${p} - 即時同步演示`;

      const [created] = await db
        .insert(party)
        .values({
          id: partyId,
          name: partyName,
          owner_id: 1,
          raid_mode: 1,
          run_type: 1,
          status: 'recruiting',
          gear_limit: 650,
          max_players: slotsPerParty,
          current_players: 0,
          note: '測試資料'
        })
        .onConflictDoNothing()
        .returning();

      if (created) {
        console.log(`✓ 已建立 party: ${created.name} (ID: ${created.id})`);
      } else {
        console.log(`ℹ party ${partyId} 已存在，跳過建立`);
      }

      // 建立 slots
      const slotsData = Array.from({ length: slotsPerParty }, (_, i) => {
        let positionType = 'dps';
        if (i < 2) positionType = 'tank';
        else if (i < 4) positionType = 'heal';

        return {
          id: `slot-${partyId}-${String(i).padStart(2, '0')}`,
          raid_id: partyId,
          slot_order: i,
          position_type: positionType,
          status: 'open',
          gear_score: 0,
          display_name: null,
          user_id: null
        };
      });

      const insertedSlots = await db
        .insert(slot)
        .values(slotsData)
        .onConflictDoNothing()
        .returning();

      console.log(`✓ 已為 ${partyId} 建立 ${insertedSlots.length} 個 slots`);
      createdParties.push(partyId);
    }

    console.log('\n📋 測試數據摘要：');
    console.log(`   Parties: ${createdParties.length} 個`);
    console.log(`   每個 party 預設 ${slotsPerParty} 個 slots (共 ${createdParties.length * slotsPerParty})`);
    console.log(`\n🚀 可前往測試頁面查看: http://localhost:5173/test?party=${createdParties[0]}`);
    console.log('   提示：開多個瀏覽器分頁測試即時同步\n');
  } catch (error) {
    console.error('❌ 建立測試數據失敗:', error);
    process.exit(1);
  } finally {
    await client.end();
  }

  process.exit(0);
}

seedTestData();
