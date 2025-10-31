-- 035: estat_metainfoテーブルからcycle、survey_date、last_fetched_atカラムを削除
-- 作成日: 2025-01-31
-- 説明: cycleとsurvey_dateは詳細表示でAPIレスポンスから直接取得しているため不要。
--       last_fetched_atは使用されていないため削除。

-- SQLiteではDROP COLUMN IF EXISTSがサポートされていないため、
-- カラムが存在する場合のみ削除する（エラーハンドリングなしで実行）

-- cycleカラムを削除
ALTER TABLE estat_metainfo DROP COLUMN cycle;

-- survey_dateカラムを削除
ALTER TABLE estat_metainfo DROP COLUMN survey_date;

-- last_fetched_atカラムを削除
ALTER TABLE estat_metainfo DROP COLUMN last_fetched_at;

