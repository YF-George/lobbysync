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

/**
 * [用戶表] - Lucia Auth 認證用
 * 儲存使用者的基本資訊與加密密碼
 */
export const user = pgTable('user', {
    id: text('id').primaryKey(),
    age: integer('age'),
    username: text('username').notNull().unique(),
    passwordHash: text('password_hash').notNull(),
    // 額外記錄 auth_id 用於未來若需與 Supabase Auth 或其他 OAuth 服務對接
    auth_id: text('auth_id')
});

/**
 * [會話表] - Lucia Auth 儲存登入狀態
 * 連結用戶與到期時間，確保系統知道「誰是誰」
 */
export const session = pgTable('session', {
    id: text('id').primaryKey(),
    userId: text('user_id')
        .notNull()
        .references(() => user.id),
    expiresAt: timestamp('expires_at', { withTimezone: true, mode: 'date' }).notNull()
});

/**
 * [自定義類型：bytea] 
 * 這是 Yjs 專用的資料轉換器。
 * 因為 Yjs 的數據是 Uint8Array (二進位)，而 Node.js 驅動通常回傳 Buffer，
 * 此轉換器確保資料從資料庫讀寫時，型別能自動在兩者間轉換。
 */
const bytea = customType<{ data: Uint8Array }>({
    dataType() {
        return 'bytea';
    },
    // 寫入資料庫：將前端傳來的 Uint8Array 轉為 Node.js 的 Buffer
    toDriver(value: Uint8Array) {
        return Buffer.from(value);
    },
    // 從資料庫讀取：確認型別為 Buffer 後轉回 Uint8Array 以供 Yjs 使用
    fromDriver(value: unknown) {
        if (Buffer.isBuffer(value)) {
            return new Uint8Array(value);
        }
        return value as Uint8Array;
    }
});

/**
 * [房間表] - 揪團系統的心臟
 * 儲存 12 個分頁的所有內容
 */
export const rooms = pgTable('rooms', {
    id: uuid('id').primaryKey().defaultRandom(),
    // 漂亮的 URL 路徑，例如 lobbysync.io/room/raid-123
    slug: text('slug').unique().notNull(),
    title: text('title').notNull(),
    // 管理員 ID，用於判斷誰有權限修改 Header (副本時間/標題) 或刪除分頁
    ownerId: text('owner_id').notNull(),

    // [核心] Yjs 完整二進位狀態
    // 這是最精準的資料，包含所有歷史紀錄與 12 個分頁的當前編輯狀態
    yjsState: bytea('yjs_state'),

    // [快照] 12 分頁 JSON 格式快照
    // 優點：在列表頁、手機瀏覽模式下，不需啟動複雜的 Yjs 引擎就能直接顯示內容
    contentSnapshot: jsonb('content_snapshot').$type<{
        pages: Record<string, any>;
    }>().default({ pages: {} }),

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull()
});

/**
 * [變更紀錄表] - 滿足「事無巨細」的需求
 * 追蹤每一個人的操作，作為「防雷/防惡搞」的審計日誌
 */
export const auditLogs = pgTable('audit_logs', {
    id: uuid('id').primaryKey().defaultRandom(),
    // cascade 確保房間刪除時，關聯的數萬筆日誌也會自動清除，不佔用空間
    roomId: uuid('room_id').references(() => rooms.id, { onDelete: 'cascade' }),
    userId: text('user_id'),     // 誰改的 (UUID)
    userName: text('user_name'), // 當時的暱稱 (冗餘儲存，防止使用者改名後歷史紀錄對不上)

    action: text('action').notNull(), // 行動描述，如 "修改分頁1副本名稱"
    detail: jsonb('detail'),       // 詳細異動，例如 { old: "400", new: "450" }

    createdAt: timestamp('created_at').defaultNow().notNull()
});

// --- 型別導出 (Type Inference) ---
// 讓你在前端 Svelte 檔案中可以直接使用型別檢查，減少 Bug
export type Session = typeof session.$inferSelect;
export type User = typeof user.$inferSelect;
export type Room = typeof rooms.$inferSelect;
export type AuditLog = typeof auditLogs.$inferSelect;