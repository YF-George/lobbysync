-- 手動新增 level_slot 欄位到 party 資料表
ALTER TABLE "party" ADD COLUMN IF NOT EXISTS "level_slot" smallint NOT NULL DEFAULT 0;
