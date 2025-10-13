-- 不要な列を削除するマイグレーション
-- estat_ranking_valuesテーブルからcategory_idとtime_period_idを削除
-- 作成日: 2025-01-XX

-- 1. 一時テーブルを作成（必要な列のみ）
CREATE TABLE IF NOT EXISTS estat_ranking_values_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  stats_data_id TEXT NOT NULL,
  area_code TEXT NOT NULL,
  value TEXT NOT NULL,
  numeric_value REAL,
  display_value TEXT,
  rank INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  unit TEXT,
  area_name TEXT,
  category_code TEXT,
  category_name TEXT,
  time_code TEXT,
  time_name TEXT,
  UNIQUE(stats_data_id, category_code, time_code, area_code)
);

-- 2. データを新しいテーブルにコピー
INSERT INTO estat_ranking_values_new (
  id, stats_data_id, area_code, value, numeric_value,
  display_value, rank, created_at, updated_at, unit,
  area_name, category_code, category_name, time_code, time_name
)
SELECT 
  id, stats_data_id, area_code, value, numeric_value,
  display_value, rank, created_at, updated_at, unit,
  area_name, category_code, category_name, time_code, time_name
FROM estat_ranking_values;

-- 3. 古いテーブルを削除
DROP TABLE estat_ranking_values;

-- 4. 新しいテーブルの名前を変更
ALTER TABLE estat_ranking_values_new RENAME TO estat_ranking_values;

-- 5. インデックスを再作成
CREATE INDEX IF NOT EXISTS idx_estat_ranking_lookup 
  ON estat_ranking_values(stats_data_id, category_code, time_code);
CREATE INDEX IF NOT EXISTS idx_estat_ranking_area 
  ON estat_ranking_values(area_code);
