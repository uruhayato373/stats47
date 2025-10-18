-- estat_metainfoテーブルにarea_type列を追加
-- 作成日: 2025-10-18
-- 目的: 地域レベル（国/都道府県/市区町村）を管理

-- 1. area_type列を追加
ALTER TABLE estat_metainfo ADD COLUMN area_type TEXT NOT NULL DEFAULT 'country';

-- 2. CHECK制約を追加
CREATE TABLE estat_metainfo_new (
  stats_data_id TEXT PRIMARY KEY,
  stat_name TEXT NOT NULL,
  title TEXT NOT NULL,
  area_type TEXT NOT NULL DEFAULT 'country',
  cycle TEXT,
  survey_date TEXT,
  description TEXT,
  last_fetched_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  CHECK (area_type IN ('country', 'prefecture', 'municipality'))
);

-- 3. データ移行
INSERT INTO estat_metainfo_new 
SELECT 
  stats_data_id,
  stat_name,
  title,
  CASE
    WHEN stats_data_id LIKE '00000101%' THEN 'prefecture'
    WHEN stats_data_id LIKE '00000202%' THEN 'municipality'
    ELSE 'country'
  END as area_type,
  cycle,
  survey_date,
  description,
  last_fetched_at,
  created_at,
  updated_at
FROM estat_metainfo;

-- 4. 旧テーブル削除
DROP TABLE estat_metainfo;

-- 5. テーブルリネーム
ALTER TABLE estat_metainfo_new RENAME TO estat_metainfo;

-- 6. インデックス再作成
CREATE INDEX idx_estat_metainfo_stat_name ON estat_metainfo(stat_name);
CREATE INDEX idx_estat_metainfo_title ON estat_metainfo(title);
CREATE INDEX idx_estat_metainfo_updated_at ON estat_metainfo(updated_at);
CREATE INDEX idx_estat_metainfo_area_type ON estat_metainfo(area_type);

-- 7. ビュー再作成
CREATE VIEW v_estat_metainfo_summary AS
SELECT 
  area_type,
  COUNT(*) as count,
  MAX(updated_at) as last_updated
FROM estat_metainfo
GROUP BY area_type;

-- 8. 確認
SELECT area_type, COUNT(*) as count FROM estat_metainfo GROUP BY area_type;
