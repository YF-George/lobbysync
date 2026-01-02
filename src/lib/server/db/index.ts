import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import { env } from '$env/dynamic/private';
import dns from 'dns';

// 若平台會回傳 IPv6 而網路不可達，優先使用 IPv4（避免 ENETUNREACH）
// Node.js 17.7+ 支援 setDefaultResultOrder
try {
	if (typeof dns.setDefaultResultOrder === 'function') {
		dns.setDefaultResultOrder('ipv4first');
		console.info('DNS result order set to ipv4first');
	}
} catch (e) {
	console.warn('Could not set DNS result order:', e);
}

if (!env.DATABASE_URL) throw new Error('DATABASE_URL is not set');

const client = postgres(env.DATABASE_URL);

// 匯出 postgres client 供診斷或直接查詢使用
export const pgClient = client;

export const db = drizzle(client, { schema });
