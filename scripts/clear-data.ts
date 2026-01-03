// 清空資料庫腳本
// 用途：刪除所有 party 和 slot 資料，保留資料庫結構
// 執行：npx tsx scripts/clear-data.ts

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

async function clearData() {
  console.log('🗑️  開始清空資料...');

  try {
    // 先刪除所有 slots (因為有外鍵關聯)
    const deletedSlots = await db.delete(slot).returning();
    console.log(`✓ 已刪除 ${deletedSlots.length} 個 slots`);

    // 再刪除所有 parties
    const deletedParties = await db.delete(party).returning();
    console.log(`✓ 已刪除 ${deletedParties.length} 個 parties`);

    console.log('\n✅ 資料清空完成！資料庫結構保持不變。\n');
  } catch (error) {
    console.error('❌ 清空資料失敗:', error);
    process.exit(1);
  } finally {
    await client.end();
  }

  process.exit(0);
}

clearData();
