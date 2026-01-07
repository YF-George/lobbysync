import { defineConfig } from 'drizzle-kit';
import * as dotenv from 'dotenv';

// 載入 .env 變數
dotenv.config();

export default defineConfig({
  schema: './src/lib/server/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL || ''
  },
  verbose: true,
  strict: true
});
