// 清空所有派對腳本（保留 pinned 成員）
// 用途：週期性清空或手動重置所有派對資料
// 執行：npx tsx scripts/clear-all-parties.ts

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { slot, changelog } from '../src/lib/server/db/schema.js';
import { sql } from 'drizzle-orm';
import 'dotenv/config';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
	console.error('❌ DATABASE_URL 未設定');
	process.exit(1);
}

const client = postgres(DATABASE_URL);
const db = drizzle(client, { schema: { slot, changelog } });

async function clearAllParties(keepPinned: boolean = true, clearLogs: boolean = false) {
	console.log('🧹 開始清空所有派對資料...');
	console.log(`   保留鎖定成員: ${keepPinned ? '是' : '否'}`);
	console.log(`   清空變更記錄: ${clearLogs ? '是' : '否'}`);

	try {
		// 清空所有未鎖定的 slots
		if (keepPinned) {
			const result = await db.execute(sql`
				UPDATE slot 
				SET 
					display_name = NULL,
					gear_score = 0,
					user_id = NULL,
					status = 'open',
					role = '',
					updated_at = NOW()
				WHERE pinned = FALSE OR pinned IS NULL
			`);
			console.log(`✓ 已清空 ${result.count} 個未鎖定的空位`);
		} else {
			const result = await db.execute(sql`
				UPDATE slot 
				SET 
					display_name = NULL,
					gear_score = 0,
					user_id = NULL,
					status = 'open',
					role = '',
					pinned = FALSE,
					updated_at = NOW()
			`);
			console.log(`✓ 已清空 ${result.count} 個空位（包含鎖定）`);
		}

		// 清空變更記錄（可選）
		if (clearLogs) {
			const logResult = await db.execute(sql`DELETE FROM changelog`);
			console.log(`✓ 已清空 ${logResult.count} 筆變更記錄`);
		} else {
			// 只添加自動清空記錄
			await db.insert(changelog).values({
				party_id: 'system',
				actor_id: null,
				actor_name: '系統',
				action: 'clear_all',
				target_type: 'party',
				target_id: 'all',
				details: `自動清空所有派對（${keepPinned ? '保留鎖定成員' : '全部清空'}）`
			});
			console.log('✓ 已記錄清空操作');
		}

		console.log('\n✅ 清空完成！');
	} catch (err) {
		console.error('❌ 清空失敗：', err);
	} finally {
		await client.end();
		process.exit(0);
	}
}

// 從命令列參數讀取選項
const args = process.argv.slice(2);
const clearAll = args.includes('--all'); // 不保留 pinned
const clearLogs = args.includes('--clear-logs'); // 清空記錄

clearAllParties(!clearAll, clearLogs);
