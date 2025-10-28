-- Migration: Refactor data_source_metadata to use ranking_key instead of ranking_item_id
-- Date: 2025-01-28
-- Description: 既存のデータは削除し、ranking_keyベースの新しいスキーマで再作成する

-- 1. 既存テーブルを削除
DROP TABLE IF EXISTS data_source_metadata;

-- 2. 新しいスキーマで再作成
CREATE TABLE data_source_metadata (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ranking_key TEXT NOT NULL,
  data_source_id TEXT NOT NULL,
  area_type TEXT NOT NULL,
  calculation_type TEXT NOT NULL DEFAULT 'direct',
  metadata TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(ranking_key, data_source_id, area_type),
  FOREIGN KEY (ranking_key) REFERENCES ranking_items(ranking_key) ON DELETE CASCADE,
  FOREIGN KEY (data_source_id) REFERENCES data_sources(id),
  CHECK (area_type IN ('prefecture', 'city', 'national')),
  CHECK (calculation_type IN ('direct', 'ratio', 'aggregate'))
);

-- 3. インデックス再作成
DROP INDEX IF EXISTS idx_data_source_metadata_ranking;
CREATE INDEX idx_data_source_metadata_ranking ON data_source_metadata(ranking_key);
CREATE INDEX idx_data_source_metadata_source ON data_source_metadata(data_source_id);
CREATE INDEX idx_data_source_metadata_area ON data_source_metadata(area_type);

