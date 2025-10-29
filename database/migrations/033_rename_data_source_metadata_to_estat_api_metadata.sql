-- Migration: Rename data_source_metadata to estat_api_metadata
-- Date: 2025-01-30
-- Description: data_source_metadataテーブルをestat_api_metadataに変更し、e-Stat API固有であることを明確化
--              data_source_idカラムを削除（e-Stat API専用テーブルなので不要）

-- ============================================================================
-- 1. 既存テーブルをバックアップ
-- ============================================================================

CREATE TABLE IF NOT EXISTS data_source_metadata_backup AS 
SELECT * FROM data_source_metadata WHERE data_source_id = 'estat';

-- ============================================================================
-- 2. 新しいestat_api_metadataテーブルを作成
-- ============================================================================

CREATE TABLE IF NOT EXISTS estat_api_metadata (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ranking_key TEXT NOT NULL,
  area_type TEXT NOT NULL,
  calculation_type TEXT NOT NULL DEFAULT 'direct',
  metadata TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(ranking_key, area_type),
  FOREIGN KEY (ranking_key) REFERENCES ranking_items(ranking_key) ON DELETE CASCADE,
  CHECK (area_type IN ('prefecture', 'city', 'national')),
  CHECK (calculation_type IN ('direct', 'ratio', 'aggregate'))
);

-- ============================================================================
-- 3. 既存データを移行（data_source_id='estat'のデータのみ）
-- ============================================================================

INSERT INTO estat_api_metadata (
  ranking_key,
  area_type,
  calculation_type,
  metadata,
  created_at,
  updated_at
)
SELECT
  ranking_key,
  area_type,
  calculation_type,
  metadata,
  created_at,
  updated_at
FROM data_source_metadata_backup;

-- ============================================================================
-- 4. インデックスを作成
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_estat_api_metadata_ranking ON estat_api_metadata(ranking_key);
CREATE INDEX IF NOT EXISTS idx_estat_api_metadata_area ON estat_api_metadata(area_type);

-- ============================================================================
-- 5. 古いインデックスを削除（テーブル削除時に自動削除されるが念のため）
-- ============================================================================

DROP INDEX IF EXISTS idx_data_source_metadata_ranking;
DROP INDEX IF EXISTS idx_data_source_metadata_source;
DROP INDEX IF EXISTS idx_data_source_metadata_area;

-- ============================================================================
-- 6. 古いテーブルを削除
-- ============================================================================

DROP TABLE IF EXISTS data_source_metadata;

-- ============================================================================
-- 7. バックアップテーブルを削除（確認後）
-- ============================================================================

-- DROP TABLE IF EXISTS data_source_metadata_backup;

