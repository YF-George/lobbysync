// 重置 slots 腳本
// 用途：保留所有 party，但清空 slots 並重新建立空白 slots
// 執行：npx tsx scripts/reset-slots.ts

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

async function resetSlots() {
  console.log('🔄 開始重置 slots...');

  try {
    // 先刪除所有 slots
    const deletedSlots = await db.delete(slot).returning();
    console.log(`✓ 已刪除 ${deletedSlots.length} 個 slots`);

    // 取得所有 parties
    const parties = await db.select().from(party);
    console.log(`✓ 找到 ${parties.length} 個 parties`);

    // 為每個 party 建立空白 slots
    let totalCreated = 0;
    for (const p of parties) {
      const slotsPerParty = p.max_players || 10;
      
      const slotsData = Array.from({ length: slotsPerParty }, (_, i) => {
        let positionType = 'dps';
        if (i < 2) positionType = 'tank';
        else if (i < 4) positionType = 'heal';

        return {
          id: `slot-${p.id}-${String(i).padStart(2, '0')}`,
          raid_id: p.id,
          slot_order: i,
          position_type: positionType,
          status: 'open',
          gear_score: 0,
          display_name: null,
          user_id: null
        };
      });

      const created = await db.insert(slot).values(slotsData).returning();
      totalCreated += created.length;
      console.log(`  ✓ ${p.name} - 建立 ${created.length} 個空白 slots`);
    }

    console.log(`\n✅ 完成！共建立 ${totalCreated} 個空白 slots\n`);
  } catch (error) {
    console.error('❌ 重置失敗:', error);
    process.exit(1);
  } finally {
    await client.end();
  }

  process.exit(0);
}

resetSlots();
