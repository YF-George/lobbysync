-- 在 Supabase SQL Editor 執行此腳本以確認 Realtime 配置

-- 1. 檢查 Realtime publication 是否存在
SELECT * FROM pg_publication WHERE pubname = 'supabase_realtime';

-- 2. 檢查哪些表已加入 Realtime
SELECT schemaname, tablename 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime'
ORDER BY tablename;

-- 3. 如果 slot 表不在列表中，執行以下命令加入
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.slot;
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.party;

-- 4. 確認 anon 角色有讀取權限
SELECT 
  schemaname,
  tablename,
  has_table_privilege('anon', schemaname || '.' || tablename, 'SELECT') as can_select
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('slot', 'party', 'user')
ORDER BY tablename;

-- 5. 檢查 RLS 是否啟用
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('slot', 'party', 'user');

-- 6. 如果需要，設定 RLS 政策（測試環境可以完全開放）
-- 對於測試環境，可以暫時允許所有讀取：

-- DROP POLICY IF EXISTS "Allow read access to all slots" ON public.slot;
-- CREATE POLICY "Allow read access to all slots" 
-- ON public.slot FOR SELECT 
-- TO anon, authenticated 
-- USING (true);

-- DROP POLICY IF EXISTS "Allow read access to all parties" ON public.party;
-- CREATE POLICY "Allow read access to all parties" 
-- ON public.party FOR SELECT 
-- TO anon, authenticated 
-- USING (true);

-- 7. 驗證測試資料存在
SELECT COUNT(*) as party_count FROM public.party WHERE id = 'test-party-001';
SELECT COUNT(*) as slot_count FROM public.slot WHERE raid_id = 'test-party-001';

-- 8. 查看 slot 表結構（確認欄位名稱）
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'slot'
ORDER BY ordinal_position;

-- 結果說明：
-- • supabase_realtime publication 必須存在
-- • slot 和 party 表必須在 publication 中
-- • anon 角色必須有 SELECT 權限
-- • 測試資料必須存在
-- • 如果啟用 RLS，需要適當的政策
