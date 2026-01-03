// 執行 SQL 新增 level_slot 欄位
import postgres from 'postgres';
import { readFileSync } from 'fs';

// 直接從 .env 檔案解析 DATABASE_URL（避免 dotenv 問題）
const envContent = readFileSync('.env', 'utf-8');
const dbUrlMatch = envContent.match(/^DATABASE_URL="([^"]+)"/m);
const DATABASE_URL = dbUrlMatch?.[1];

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL 未設定');
  process.exit(1);
}

const client = postgres(DATABASE_URL);

async function addLevelSlot() {
  try {
    console.log('🔧 正在新增 level_slot 欄位...');
    
    await client`
      ALTER TABLE "party" 
      ADD COLUMN IF NOT EXISTS "level_slot" smallint NOT NULL DEFAULT 0
    `;
    
    console.log('✅ level_slot 欄位已新增');
    
    // 驗證
    const result = await client`
      SELECT column_name 
      FROM information_schema.columns
      WHERE table_name = 'party' AND column_name = 'level_slot'
    `;
    
    if (result.length > 0) {
      console.log('✅ 驗證成功：level_slot 欄位存在');
    }
    
  } catch (error: any) {
    if (error.message?.includes('already exists')) {
      console.log('ℹ️ level_slot 欄位已存在');
    } else {
      console.error('❌ 新增失敗:', error);
      process.exit(1);
    }
  } finally {
    await client.end();
  }
}

addLevelSlot();
