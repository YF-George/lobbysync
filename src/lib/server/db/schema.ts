import {
	pgTable,
	serial,
	integer,
	text,
	timestamp,
	uuid,
	jsonb,
	customType
} from 'drizzle-orm/pg-core';

// 保留既有 user/session 定義（請注意 auth -> db 對映邏輯）
export const user = pgTable('user', {
	id: text('id').primaryKey(),
	age: integer('age'),
	username: text('username').notNull().unique(),
	passwordHash: text('password_hash').notNull(),
	// optional: auth_id 用於對應 Supabase UUID（若專案使用映射請確認欄位存在）
	auth_id: text('auth_id')
});

export const session = pgTable('session', {
	id: text('id').primaryKey(),
	userId: text('user_id')
		.notNull()
		.references(() => user.id),
	expiresAt: timestamp('expires_at', { withTimezone: true, mode: 'date' }).notNull()
});

// PostgreSQL bytea 對應，用於儲存 Yjs state updates（轉換 Buffer <-> Uint8Array）
const bytea = customType<Uint8Array>({
	dataType() {
		return 'bytea';
	},
	fromDriver(value: unknown) {
		if (value instanceof Buffer) return new Uint8Array(value);
		return value as Uint8Array;
	},
	toDriver(value: Uint8Array) {
		return Buffer.from(value);
	}
});

// 房間表：儲存揪團的核心狀態與 Yjs 二進位資料
export const rooms = pgTable('rooms', {
	id: uuid('id').primaryKey().defaultRandom(),
	slug: text('slug').unique().notNull(),
	title: text('title').notNull(),
	ownerId: text('owner_id').notNull(),

	// 完整 Yjs 二進位狀態，用於 PartyKit/Yjs 恢復
	yjsState: bytea('yjs_state'),

	// 存放 12 分頁快照的 JSONB，方便列表或不啟動 Yjs 的情況下快速取得內容
	contentSnapshot: jsonb('content_snapshot').$type<{
		pages: Record<string, any>;
	}>().default({ pages: {} }),

	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// 變更紀錄表：記錄操作與 diff 資訊
export const auditLogs = pgTable('audit_logs', {
	id: uuid('id').primaryKey().defaultRandom(),
	roomId: uuid('room_id').references(() => rooms.id, { onDelete: 'cascade' }),
	userId: text('user_id'),
	userName: text('user_name'),

	action: text('action').notNull(),
	detail: jsonb('detail'),

	createdAt: timestamp('created_at').defaultNow().notNull()
});

export type Session = typeof session.$inferSelect;

export type User = typeof user.$inferSelect;

export type Room = typeof rooms.$inferSelect;

export type AuditLog = typeof auditLogs.$inferSelect;
