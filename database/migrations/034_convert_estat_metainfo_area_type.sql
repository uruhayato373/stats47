-- Migration: Convert estat_metainfo area_type to AreaType standard
-- Date: 2025-01-31
-- Description: estat_metainfoテーブルのarea_typeを'country'/'prefecture'/'municipality'から
--              AreaType型（'national'/'prefecture'/'city'）に統一
--              変換: 'country' → 'national', 'municipality' → 'city'

-- ============================================================================
-- 1. 既存テーブルをバックアップ
-- ============================================================================

CREATE TABLE IF NOT EXISTS estat_metainfo_backup AS 
SELECT * FROM estat_metainfo;

-- ============================================================================
-- 2. 既存データのarea_typeを変換
-- ============================================================================

UPDATE estat_metainfo
SET area_type = CASE
  WHEN area_type = 'country' THEN 'national'
  WHEN area_type = 'municipality' THEN 'city'
  ELSE area_type
END
WHERE area_type IN ('country', 'municipality');

-- ============================================================================
-- 3. CHECK制約を削除（SQLiteではALTER TABLEでCHECK制約を削除できないため、
--    テーブルを再作成する必要がある）
-- ============================================================================

-- 新しいテーブルを作成（CHECK制約を更新）
CREATE TABLE estat_metainfo_new (
  stats_data_id TEXT PRIMARY KEY,
  stat_name TEXT NOT NULL,
  title TEXT NOT NULL,
  area_type TEXT NOT NULL DEFAULT 'national',
  cycle TEXT,
  survey_date TEXT,
  description TEXT,
  last_fetched_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  CHECK (area_type IN ('national', 'prefecture', 'city'))
);

-- ============================================================================
-- 4. 既存データを新しいテーブルに移行
-- ============================================================================

INSERT INTO estat_metainfo_new (
  stats_data_id,
  stat_name,
  title,
  area_type,
  cycle,
  survey_date,
  description,
  last_fetched_at,
  created_at,
  updated_at
)
SELECT
  stats_data_id,
  stat_name,
  title,
  area_type,
  cycle,
  survey_date,
  description,
  last_fetched_at,
  created_at,
  updated_at
FROM estat_metainfo;

-- ============================================================================
-- 5. インデックスを再作成
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_estat_metainfo_stat_name ON estat_metainfo_new(stat_name);
CREATE INDEX IF NOT EXISTS idx_estat_metainfo_title ON estat_metainfo_new(title);
CREATE INDEX IF NOT EXISTS idx_estat_metainfo_area_type ON estat_metainfo_new(area_type);
CREATE INDEX IF NOT EXISTS idx_estat_metainfo_updated_at ON estat_metainfo_new(updated_at);

-- ============================================================================
-- 6. 古いテーブルを削除
-- ============================================================================

DROP TABLE estat_metainfo;

-- ============================================================================
-- 7. 新しいテーブルをリネーム
-- ============================================================================

ALTER TABLE estat_metainfo_new RENAME TO estat_metainfo;

-- ============================================================================
-- 8. バックアップテーブルを削除（確認後）
-- ============================================================================

-- DROP TABLE IF EXISTS estat_metainfo_backup;
