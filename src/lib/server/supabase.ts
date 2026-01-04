// Server-side Supabase client initializer
//
// 說明：
// - 這個檔案在 server-side 初始化一個 Supabase client，使用的是
//   Service Role Key（最高權限）。這個 client 應只在 server 端使用，
//   切勿在任何會被瀏覽器存取的程式碼中暴露或傳遞這個實例。
// - 若金鑰外流，請立即在 Supabase 控制台撤銷並重新產生金鑰。

import { createClient } from '@supabase/supabase-js';
import { env } from '$env/dynamic/private';

// Prefer private server env vars. Fallback to process.env (including PUBLIC_*)
const SUPABASE_URL =
	env.SUPABASE_URL ?? process.env.SUPABASE_URL ?? process.env.PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY =
	env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabaseAdmin: any;
if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
	// Properly configured admin client
	supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
		auth: { persistSession: false }
	});
} else {
	// Fallback dummy client to avoid build-time crashes when env vars are not set (local dev).
	// Real deployments (Vercel) should set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.
	console.warn(
		'supabaseAdmin: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set; using dummy client'
	);
	supabaseAdmin = {
		channel: () => ({
			subscribe: async () => {},
			send: async () => {
				throw new Error('supabaseAdmin not configured');
			},
			unsubscribe: async () => {}
		}),
		removeChannel: () => {},
		auth: { admin: false }
	};
}

export { supabaseAdmin };
export default supabaseAdmin;
