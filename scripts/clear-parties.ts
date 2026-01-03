// 清空所有派對（保留 pinned 成員）
// 用途：管理員手動清空或週期自動清空
// 執行：npx tsx scripts/clear-parties.ts

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { party, slot, changelog } from '../src/lib/server/db/schema.js';
import { eq, sql } from 'drizzle-orm';
import 'dotenv/config';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
	console.error('❌ DATABASE_URL 未設定');
	process.exit(1);
}

const client = postgres(DATABASE_URL);
const db = drizzle(client, { schema: { party, slot, changelog } });

async function clearAllParties() {
	console.log('🧹 開始清空所有派對（保留鎖定成員）...\n');

	try {
		// 獲取所有派對
		const parties = await db.select().from(party);
		console.log(`找到 ${parties.length} 個派對\n`);

		for (const p of parties) {
			// 獲取此派對的所有 slots
			const slots = await db.select().from(slot).where(eq(slot.raid_id, p.id));

			let clearedCount = 0;
			let pinnedCount = 0;

			for (const s of slots) {
				if (s.pinned) {
					// 保留 pinned 成員
					pinnedCount++;
					console.log(`  ✓ 保留鎖定成員: ${s.display_name || '(空)'} [${s.position_type}]`);
				} else {
					// 清空非鎖定成員
					await db
						.update(slot)
						.set({
							display_name: null,
							user_id: null,
							gear_score: 0,
							status: 'open',
							role: '',
							note: null,
							updated_at: sql`now()`
						})
						.where(eq(slot.id, s.id));
					clearedCount++;
				}
			}

			// 清空派對元數據
			await db
				.update(party)
				.set({
					status: 'recruiting',
					start_at: null,
					note: null,
					current_players: pinnedCount,
					updated_at: sql`now()`
				})
				.where(eq(party.id, p.id));

			// 記錄清空操作到 changelog
			await db.insert(changelog).values({
				party_id: p.id,
				actor_id: 1, // system
				actor_name: 'System',
				action: 'clear',
				target_type: 'party',
				target_id: p.id,
				details: `清空派對（保留 ${pinnedCount} 個鎖定成員，清空 ${clearedCount} 個成員）`
			});

			console.log(`✓ ${p.name}: 清空 ${clearedCount} 個成員，保留 ${pinnedCount} 個鎖定成員\n`);
		}

		console.log('✅ 清空完成！');
	} catch (err) {
		console.error('❌ 清空失敗:', err);
	} finally {
		await client.end();
		process.exit(0);
	}
}

clearAllParties();
