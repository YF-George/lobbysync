# Copilot 指南 — lobbysync

目的：讓 AI 編碼代理能快速理解專案架構、常用工作流程與專案特有慣例，方便安全、符合專案風格地修改或新增程式碼。

重點摘要
- 專案類型：SvelteKit 前端 + server-side helpers，使用 Vite、Tailwind、TypeScript。
- 資料層：使用 `drizzle-orm` 與 `drizzle-kit` 管理 migrations 與 schema（請參考 `drizzle.config.ts` 與 `package.json` 中的 db:* 腳本）。
- 認證：使用 Supabase admin client（見 `src/lib/server/auth.ts`），API 預期能接受「匿名」情況（沒有 token）——`verifyAuth` 會回傳一個匿名 user 物件。

重要命令（在本專案根目錄）
- 開發伺服器：`pnpm dev` 或 `npm run dev`（對應 `vite dev`）。
- 建置：`pnpm build` / `npm run build`。
- 預覽：`pnpm preview`。
- 型別/檢查：`pnpm check`、`pnpm check:watch`（會呼叫 `svelte-check`）。
- 格式化 / lint：`pnpm format`、`pnpm lint`（Prettier + ESLint）。
- Drizzle (DB)：`pnpm db:push`, `pnpm db:generate`, `pnpm db:migrate`, `pnpm db:studio`。

專案慣例與要注意的實作細節
- 匿名使用者處理：`src/lib/server/auth.ts` 中的 `verifyAuth` 即使沒有 Authorization header 也會回傳固定 ANON id。修改後端 endpoint 時請維持這個行為，避免強制要求 token，除非 endpoint 明確要求。
- Auth 與資料庫 ID 對映：Auth 使用 UUID（Supabase），資料庫目前使用 integer id；專案使用 `mapAuthUserToDbUserId` 在 `src/lib/server/auth.ts` 做對映與必要的建立。修改或重構時要保留或遷移此對映邏輯（否則會造成使用者 id 不一致）。
- 資料庫存取：使用 `drizzle-orm` 的 query style（請參考 `src/lib/server/db/index.ts` 與 `src/lib/server/db/schema.ts`）。避免直接用 raw SQL 除非不可避免，且要在 `drizzle-kit` migration 記錄中同步變更。
- 前端路由：主要頁面位於 `src/routes`，採 SvelteKit 檔案路由慣例（`+page.svelte`, `+page.server.ts`, `+layout.svelte` 等）。若新增 API endpoint，使用 SvelteKit server 檔名慣例。
- Styling：Tailwind CSS 與 `@tailwindcss/forms` 插件，Vite plugin 在 `vite.config.ts` 已設定。新增 class 或 component 時請遵循現有 tailwind utility 使用模式。

整合點與外部依賴
- Supabase admin（在 `src/lib/server/supabase`（或相似檔案）初始化），負責驗證 token 與取得使用者資訊。
- Postgres 驅動：`postgres` 套件，與 `drizzle-orm` 一起使用。
- 實時/協作：有引入 `yjs` 與 `partykit` / `y-partykit`，表示專案可能有 collaborative editing / shared state 機制，修改這部分需注意同步協定與初始化流程。

檔案參考（閱讀優先順序）
 - `package.json` — 腳本、相依性。
 - `svelte.config.js`, `vite.config.ts` — build 與 plugin 配置。
 - `drizzle.config.ts` — Drizzle 設定與 migration 流程。
 - `src/lib/server/auth.ts` — 認證/匿名處理、auth -> db user 對映。
 - `src/lib/server/db/schema.ts` — DB schema 定義。
 - `src/routes` — SvelteKit 路由與 server endpoints。

行為守則（對 AI 代理的具體建議）
- 在變更任何與使用者身分、授權或 DB schema 有關的程式碼之前，先搜尋並參考 `src/lib/server/auth.ts` 與 `src/lib/server/db/schema.ts`，並確認是否需要 migration；若需 migration，請同時更新 `drizzle` migration 並在 commit 中包含 `drizzle-kit` 指令建議。
- 不要移除或改變匿名使用者 fallback，除非使用者明確要求鎖定為 authenticated-only，並且已更新所有受影響 endpoint。
- 新增 API endpoint 時，偏好使用 SvelteKit server 檔案（`+server.ts` / `+page.server.ts`），回傳型別應使用現有 TypeScript 類型與 db schema。
- 測試或手動驗證：在 DB schema 或認證邏輯改動後，執行 `pnpm db:generate` 並在本地啟動（`pnpm dev`）測試主要 flows（登入／匿名流程／資料 CRUD）。

若遇到不確定情況
- 若不確定某段變更是否會破壞使用者對映或 DB 一致性，請在 PR 描述中說明風險，並標記 reviewer。

結語
本文件重點在於「可被自動化代理安全地採用的約定與邊界」。如需擴充（例如加入測試/lint 規範、CI 流程或更細的 commit message 規則），請回覆指出想補強的區域。
