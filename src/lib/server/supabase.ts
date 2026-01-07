import { env } from '$env/dynamic/private';

// 本檔為開發用 placeholder；正式部署請用 @supabase/supabase-js createClient
// 並替換下列實作以使用真實的 supabaseAdmin

export const supabaseAdmin = {
  auth: {
    async getUser(token: string) {
      // 在開發環境中回傳模擬使用者；正式環境請返回 supabase 回傳結果
      if (!token) return { data: { user: null }, error: { message: 'no token' } };
      return { data: { user: { id: 'dev-user-123', email: 'dev@example.com' } }, error: null };
    }
  }
};

export async function verifyUser(token: string) {
  if (!token) return null;
  return await supabaseAdmin.auth.getUser(token);
}
