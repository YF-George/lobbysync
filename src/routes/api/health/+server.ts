import { json } from '@sveltejs/kit';
import { pgClient } from '$lib/server/db';

export async function GET() {
  try {
    // 使用 postgres 客戶端直接執行簡單查詢以驗證連線
    const res = await pgClient`select 1 as ok`;
    return json({ ok: true, result: res });
  } catch (err) {
    console.error('Health check failed:', err);
    return json({ ok: false, error: String(err) }, { status: 500 });
  }
}
