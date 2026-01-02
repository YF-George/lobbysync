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

    // 建立測試 party
    const testPartyId = 'test-party-001';
    const [testParty] = await db
      .insert(party)
      .values({
        id: testPartyId,
        name: '測試副本 - 即時同步演示',
        owner_id: 1, // 假設 user id = 1 存在
        raid_mode: 1,
        run_type: 1,
        status: 'recruiting',
        gear_limit: 650,
        max_players: 10,
        current_players: 0,
        note: '這是測試用的副本，用來演示即時更新功能'
      })
      .onConflictDoNothing()
      .returning();

    if (testParty) {
      console.log(`✓ 已建立測試 party: ${testParty.name} (ID: ${testParty.id})`);
    } else {
      console.log(`ℹ party ${testPartyId} 已存在，跳過建立`);
    }

    // 建立 10 個 slots（2 坦、2 補、6 輸出）
    const slotsData = Array.from({ length: 10 }, (_, i) => {
      let positionType = 'dps';
      if (i < 2) positionType = 'tank';
      else if (i < 4) positionType = 'heal';

      return {
        id: `slot-${testPartyId}-${String(i).padStart(2, '0')}`,
        raid_id: testPartyId,
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

    console.log(`✓ 已建立 ${insertedSlots.length} 個測試 slots`);
    console.log('\n📋 測試數據摘要：');
    console.log(`   Party ID: ${testPartyId}`);
    console.log(`   Slots: ${slotsData.length} 個 (2 坦, 2 補, 6 輸出)`);
    console.log(`\n🚀 可前往測試頁面查看: http://localhost:5173/test?party=${testPartyId}`);
    console.log('   提示：開兩個瀏覽器分頁測試即時同步\n');
  } catch (error) {
    console.error('❌ 建立測試數據失敗:', error);
    process.exit(1);
  } finally {
    await client.end();
  }

  process.exit(0);
}

seedTestData();
