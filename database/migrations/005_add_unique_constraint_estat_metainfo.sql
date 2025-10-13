-- estat_metainfo UNIQUE制約追加マイグレーション
-- 実行日: 2025-01-13
-- 目的: (stats_data_id, cat01)にUNIQUE制約を追加して重複を防止

-- SQLiteでは既存テーブルにUNIQUE制約を追加できないため、テーブルを再作成

-- ステップ0: 既存のビューを削除（テーブル再作成前に必要）
DROP VIEW IF EXISTS estat_metainfo_unique;

-- ステップ1: 新しいテーブルを作成（UNIQUE制約付き）
CREATE TABLE IF NOT EXISTS estat_metainfo_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  stats_data_id TEXT NOT NULL,
  stat_name TEXT NOT NULL,
  title TEXT NOT NULL,
  cat01 TEXT,
  item_name TEXT,
  unit TEXT,
  ranking_key TEXT,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(stats_data_id, cat01)  -- ← UNIQUE制約を追加
);

-- ステップ2: データをコピー
INSERT INTO estat_metainfo_new
  (id, stats_data_id, stat_name, title, cat01, item_name, unit, ranking_key, updated_at, created_at)
SELECT id, stats_data_id, stat_name, title, cat01, item_name, unit, ranking_key, updated_at, created_at
FROM estat_metainfo;

-- ステップ3: 古いテーブルを削除
DROP TABLE estat_metainfo;

-- ステップ4: 新しいテーブルをリネーム
ALTER TABLE estat_metainfo_new RENAME TO estat_metainfo;

-- ステップ5: インデックスを再作成
CREATE INDEX IF NOT EXISTS idx_stats_data_id ON estat_metainfo(stats_data_id);
CREATE INDEX IF NOT EXISTS idx_stat_name ON estat_metainfo(stat_name);
CREATE INDEX IF NOT EXISTS idx_cat01 ON estat_metainfo(cat01);
CREATE INDEX IF NOT EXISTS idx_updated_at ON estat_metainfo(updated_at);
CREATE INDEX IF NOT EXISTS idx_estat_metainfo_ranking_key ON estat_metainfo(ranking_key);

-- ステップ6: 複合インデックス（検索高速化）
CREATE INDEX IF NOT EXISTS idx_estat_metainfo_stats_cat ON estat_metainfo(stats_data_id, cat01);

-- ステップ7: 確認
SELECT
  name,
  sql
FROM sqlite_master
WHERE type = 'index'
  AND tbl_name = 'estat_metainfo';

-- テーブル構造の確認
SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'estat_metainfo';