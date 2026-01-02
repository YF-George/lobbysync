# Supabase 設定指南

## 🔐 步驟 1：啟用匿名登入（Anonymous Sign-in）

1. 前往 [Supabase Dashboard](https://supabase.com/dashboard)
2. 選擇你的專案
3. 左側選單 → **Authentication** → **Providers**
4. 找到 **Anonymous Sign-in** → 點擊 **Enable**
5. 儲存設定

## 📡 步驟 2：啟用 Realtime 資料庫變更

### 方法 A：透過 Replication 頁面（推薦）
1. 在 Supabase Dashboard，左側選單 → **Database** → **Replication**
2. 找到 `slot` 表格
3. 勾選 **Enable Replication** (這樣才能使用 Database Changes)
4. (可選) 同樣為 `party` 表格啟用 Replication

### 方法 B：如果找不到 Replication 頁面
可能是介面更新，改用以下步驟：

1. 左側選單 → **Database** → **Tables**
2. 點選 `slot` 表格
3. 在右上角找到 **Enable Realtime** 按鈕並啟用
4. 或是前往 **Project Settings** → **API** → **Realtime** 確認功能已啟用

### 方法 C：透過 SQL 手動啟用（終極方案）
如果以上都找不到，可以執行 SQL：

```sql
-- 為 slot 表啟用 Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE slot;

-- (可選) 為 party 表啟用
ALTER PUBLICATION supabase_realtime ADD TABLE party;
```

在 **SQL Editor** 執行以上指令即可。

## 🧪 測試步驟

完成上述設定後：

1. 開啟 http://localhost:5174/test
2. 頁面載入時會自動執行匿名登入
3. 看到 **✅ JWT 驗證已啟用** 表示成功
4. 檢查瀏覽器 Console，應該看到：
   ```
   ✅ 匿名登入成功，Token: eyJhbGc...
   ```
5. 嘗試修改任一 slot 的名稱或職業
6. 開啟第二個瀏覽器分頁測試即時同步

## ⚠️ 已知限制

目前使用**臨時的 UUID → integer 映射**：
- 在 `src/lib/server/auth.ts` 的 `mapAuthUserToDbUserId()` 使用 hash 方式
- **不適合正式環境**！兩個不同 UUID 可能碰撞到相同 integer

## 🔧 正式解決方案（擇一）

### 方案 A：改 schema 為 UUID (推薦)
```typescript
// src/lib/server/db/schema.ts
export const user = pgTable('user', {
  id: uuid('id').primaryKey().defaultRandom(), // 改用 UUID
  // ...
});

export const party = pgTable('party', {
  // ...
  owner_id: uuid('owner_id').references(() => user.id), // 改用 UUID
});

export const slot = pgTable('slot', {
  // ...
  user_id: uuid('user_id').references(() => user.id), // 改用 UUID
});
```

### 方案 B：建立 auth_id 映射
```typescript
export const user = pgTable('user', {
  id: serial('id').primaryKey(), // 保持 integer
  auth_id: uuid('auth_id').unique().notNull(), // 新增 Supabase Auth UUID
  // ...
});
```

然後在 auth helper 改為查表：
```typescript
export async function mapAuthUserToDbUserId(authUserId: string): Promise<number> {
  const result = await db.select({ id: user.id })
    .from(user)
    .where(eq(user.auth_id, authUserId));
  
  if (result.length === 0) {
    // 首次登入，自動建立新使用者
    const newUser = await db.insert(user)
      .values({ auth_id: authUserId })
      .returning({ id: user.id });
    return newUser[0].id;
  }
  
  return result[0].id;
}
```

## 📝 下一步

- [ ] 在 Supabase 啟用匿名登入
- [ ] 啟用 slot 表的 Replication
- [ ] 測試 JWT 驗證流程
- [ ] 決定採用方案 A 或 B 解決 user ID 類型不一致問題
