import { pgTable, serial, integer, varchar, text, smallint, boolean, timestamp, uuid } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// Users table (existing)
export const user = pgTable('user', {
	id: serial('id').primaryKey(),
	// 新增 Supabase Auth UUID 映射欄位（可為 null，之後可回填）
	auth_id: uuid('auth_id').unique(),
	age: integer('age')
});

// Parties (副本場次)
export const party = pgTable('party', {
	// UUID stored as varchar(36) with gen_random_uuid() default; requires pgcrypto extension
	id: varchar('id', { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
	name: varchar('name', { length: 255 }).notNull(),
	raid_mode: smallint('raid_mode').notNull().default(1),
	run_type: smallint('run_type').notNull().default(1),
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
	id: varchar('id', { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
	raid_id: varchar('raid_id', { length: 36 }).notNull(),
	slot_order: smallint('slot_order').notNull().default(0),
	position_type: varchar('position_type', { length: 20 }).notNull().default('dps'),
	user_id: integer('user_id'),
	display_name: varchar('display_name', { length: 100 }),
	gear_score: integer('gear_score').notNull().default(0),
	status: varchar('status', { length: 20 }).notNull().default('open'),
	locked_until: timestamp('locked_until', { mode: 'string' }),
	tags: text('tags').array().default(sql`ARRAY[]::text[]`),
	note: text('note'),
	updated_at: timestamp('updated_at', { mode: 'string' }).notNull().default(sql`now()`)
});
