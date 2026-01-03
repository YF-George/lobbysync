// 將 level_slot 從 smallint 改為 integer
import postgres from 'postgres';
import { readFileSync } from 'fs';

const envContent = readFileSync('.env', 'utf-8');
const dbUrlMatch = envContent.match(/^DATABASE_URL="([^"]+)"/m);
const DATABASE_URL = dbUrlMatch?.[1];

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL 未設定');
  process.exit(1);
}

const client = postgres(DATABASE_URL);

async function changeLevelSlotType() {
  try {
    console.log('🔧 正在將 level_slot 改為 integer 類型...');
    
    await client`
      ALTER TABLE "party" 
      ALTER COLUMN "level_slot" TYPE integer
    `;
    
    console.log('✅ level_slot 已改為 integer 類型');
    
  } catch (error: any) {
    console.error('❌ 修改失敗:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

changeLevelSlotType();
