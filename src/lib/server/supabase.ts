// Server-side Supabase client initializer
//
// 說明：
// - 這個檔案在 server-side 初始化一個 Supabase client，使用的是
//   Service Role Key（最高權限）。這個 client 應只在 server 端使用，
//   切勿在任何會被瀏覽器存取的程式碼中暴露或傳遞這個實例。
// - 若金鑰外流，請立即在 Supabase 控制台撤銷並重新產生金鑰。

import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';
import { env } from '$env/dynamic/private';

// 驗證必要的環境變數，若未設定則在啟動時拋出錯誤，避免隱性失敗。
if (!PUBLIC_SUPABASE_URL) throw new Error('PUBLIC_SUPABASE_URL is not set');
if (!env.SUPABASE_SERVICE_ROLE_KEY) throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set');

// 初始化一個 admin client：
// - 使用 Service Role Key 可以繞過 RLS（Row Level Security），用於
//   初始化資料、後台管理或其他必須有完全權限的 server-side 任務。
// - 設定 `persistSession: false` 可以避免在 server 端儲存/建立 user session。
export const supabaseAdmin = createClient(
  PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

// 預設匯出方便在其他 server 模組中直接使用：
export default supabaseAdmin;
