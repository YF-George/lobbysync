import { pgTable, serial, integer, varchar, text, smallint, boolean, timestamp, uuid } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// Users table (existing)
export const user = pgTable('user', {
	id: serial('id').primaryKey(),
	// 新增 Supabase Auth UUID 映射欄位（可為 null，之後可回填）
	auth_id: uuid('auth_id').unique(),
	// 管理員標記
	is_admin: boolean('is_admin').notNull().default(false),
	age: integer('age')
});

// Parties (副本場次)
export const party = pgTable('party', {
	// UUID stored as varchar(36) with gen_random_uuid() default; requires pgcrypto extension
	id: varchar('id', { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
	// 允許預設為空字串，避免 null 值導致 UI 或後端錯誤
	name: varchar('name', { length: 255 }).notNull().default(''),
	raid_mode: smallint('raid_mode').notNull().default(1),
	run_type: smallint('run_type').notNull().default(1),
	level_slot: integer('level_slot').notNull().default(0),
	start_at: timestamp('start_at', { mode: 'string' }),
	// owner_id uses existing user.id (serial integer)
	owner_id: integer('owner_id').notNull(),
	status: varchar('status', { length: 20 }).notNull().default('recruiting'),
	is_locked: boolean('is_locked').notNull().default(false),
	locked_by: integer('locked_by'),
	locked_at: timestamp('locked_at', { mode: 'string' }),
	discord_webhook: text('discord_webhook'),
	gear_limit: integer('gear_limit').notNull().default(0),
	max_players: smallint('max_players').notNull().default(10),
	current_players: smallint('current_players').notNull().default(0),
	note: text('note'),
	updated_at: timestamp('updated_at', { mode: 'string' }).notNull().default(sql`now()`),
	created_at: timestamp('created_at', { mode: 'string' }).notNull().default(sql`now()`)
});

// Slots (Grid 中的一格)
export const slot = pgTable('slot', {
	id: varchar('id', { length: 64 }).primaryKey().default(sql`gen_random_uuid()`),
	raid_id: varchar('raid_id', { length: 36 }).notNull(),
	slot_order: smallint('slot_order').notNull().default(0),
	position_type: varchar('position_type', { length: 20 }).notNull().default('dps'),
	user_id: integer('user_id'),
	display_name: varchar('display_name', { length: 100 }),
	gear_score: integer('gear_score').notNull().default(0),
	status: varchar('status', { length: 20 }).notNull().default('open'),
	locked_until: timestamp('locked_until', { mode: 'string' }),
	note: text('note'),
	// 新增：成員鎖定功能（防止清空時誤刪）
	pinned: boolean('pinned').notNull().default(false),
	// 新增：角色標記（隊長/幫打）
	role: varchar('role', { length: 20 }).default(''),
	updated_at: timestamp('updated_at', { mode: 'string' }).notNull().default(sql`now()`)
});

// Admins table: 可用於管理多個管理員帳號（以 local user.id 參照）
export const admin = pgTable('admin', {
	id: serial('id').primaryKey(),
	// 參照 user.id（integer）
	user_id: integer('user_id').notNull().unique(),
	note: varchar('note', { length: 255 }),
	created_at: timestamp('created_at', { mode: 'string' }).notNull().default(sql`now()`)
});

// Changelog table: 追蹤所有變更記錄
export const changelog = pgTable('changelog', {
	id: varchar('id', { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
	party_id: varchar('party_id', { length: 36 }).notNull(),
	actor_id: integer('actor_id'), // 操作者 user.id
	actor_name: varchar('actor_name', { length: 100 }), // 操作者名稱快照
	action: varchar('action', { length: 50 }).notNull(), // 'create', 'update', 'delete', 'pin', 'unpin', 'clear'
	target_type: varchar('target_type', { length: 20 }), // 'party', 'slot'
	target_id: varchar('target_id', { length: 36 }), // 目標 ID
	field: varchar('field', { length: 50 }), // 更新的欄位名稱
	old_value: text('old_value'), // 舊值
	new_value: text('new_value'), // 新值
	details: text('details'), // 詳細描述
	created_at: timestamp('created_at', { mode: 'string' }).notNull().default(sql`now()`)
});

// Kicked users table: 管理員踢人記錄
export const kicked = pgTable('kicked', {
	id: serial('id').primaryKey(),
	party_id: varchar('party_id', { length: 36 }).notNull(),
	user_auth_id: uuid('user_auth_id').notNull(), // Supabase auth UUID
	kicked_by: integer('kicked_by').notNull(), // 踢人的管理員 user.id
	kicked_at: timestamp('kicked_at', { mode: 'string' }).notNull().default(sql`now()`),
	reason: text('reason')
});
