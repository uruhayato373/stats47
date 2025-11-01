-- ============================================================================
-- マイグレーション: estat_ranking_mappings テーブル構造変更
-- ============================================================================
-- 作成日: 2025-01-XX
-- 説明: estat_ranking_mappingsテーブルにarea_typeを追加し、
--       dividing_value、new_unit、ascendingカラムを削除

-- 1. 新しいテーブル構造で一時テーブルを作成
CREATE TABLE IF NOT EXISTS estat_ranking_mappings_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  stats_data_id TEXT NOT NULL,
  cat01 TEXT NOT NULL,
  item_name TEXT NOT NULL,
  item_code TEXT NOT NULL,
  unit TEXT,
  area_type TEXT NOT NULL DEFAULT 'prefecture',  -- 'prefecture' | 'city' | 'national'
  is_ranking BOOLEAN DEFAULT 0,  -- ランキング変換対象フラグ
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(stats_data_id, cat01, item_code),
  CHECK (area_type IN ('prefecture', 'city', 'national'))
);

-- 2. 既存データを新しいテーブルに移行（area_typeはデフォルトで'prefecture'）
INSERT INTO estat_ranking_mappings_new (
  id, stats_data_id, cat01, item_name, item_code, unit,
  is_ranking, created_at, updated_at
)
SELECT 
  id, stats_data_id, cat01, item_name, item_code, unit,
  is_ranking, created_at, updated_at
FROM estat_ranking_mappings;

-- 3. 古いテーブルを削除
DROP TABLE IF EXISTS estat_ranking_mappings;

-- 4. 新しいテーブルをリネーム
ALTER TABLE estat_ranking_mappings_new RENAME TO estat_ranking_mappings;

-- 5. インデックスを再作成
CREATE INDEX IF NOT EXISTS idx_estat_ranking_mappings_stats_data_id 
  ON estat_ranking_mappings(stats_data_id);
CREATE INDEX IF NOT EXISTS idx_estat_ranking_mappings_is_ranking 
  ON estat_ranking_mappings(is_ranking);
CREATE INDEX IF NOT EXISTS idx_estat_ranking_mappings_item_code 
  ON estat_ranking_mappings(item_code);
CREATE INDEX IF NOT EXISTS idx_estat_ranking_mappings_area_type 
  ON estat_ranking_mappings(area_type);

