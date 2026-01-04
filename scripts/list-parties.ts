// 列出前 5 個 party
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

async function listParties() {
	try {
		const result = await client`
      SELECT id, name, raid_mode, run_type, level_slot
      FROM party
      ORDER BY created_at DESC
      LIMIT 5
    `;

		console.log('📋 前 5 個 party：\n');
		result.forEach((p: any) => {
			console.log(`ID: ${p.id}`);
			console.log(`  名稱: ${p.name}`);
			console.log(`  副本模式(raid_mode): ${p.raid_mode}`);
			console.log(`  種類(run_type): ${p.run_type}`);
			console.log(`  等級(level_slot): ${p.level_slot}`);
			console.log('');
		});
	} catch (error) {
		console.error('❌ 查詢失敗:', error);
	} finally {
		await client.end();
	}
}

listParties();
