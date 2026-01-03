// 檢查 party 資料表的欄位
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import 'dotenv/config';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL 未設定');
  process.exit(1);
}

const client = postgres(DATABASE_URL);
const db = drizzle(client);

async function checkSchema() {
  try {
    const result = await client`
      SELECT column_name, data_type, column_default, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'party'
      ORDER BY ordinal_position;
    `;
    
    console.log('📋 Party 資料表欄位：\n');
    result.forEach((col: any) => {
      console.log(`  ${col.column_name.padEnd(20)} ${col.data_type.padEnd(20)} ${col.column_default || 'null'}`);
    });
    
    const hasLevelSlot = result.some((col: any) => col.column_name === 'level_slot');
    console.log(`\n${hasLevelSlot ? '✅' : '❌'} level_slot 欄位${hasLevelSlot ? '存在' : '不存在'}`);
    
  } catch (error) {
    console.error('❌ 檢查失敗:', error);
  } finally {
    await client.end();
  }
}

checkSchema();
