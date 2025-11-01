-- ============================================================================
-- マイグレーション: estat_ranking_mappings テーブル構造変更
-- ============================================================================
-- 作成日: 2025-01-XX
-- 説明: estat_ranking_mappingsテーブルのidカラムを削除し、
--       stats_data_idとcat01の複合PRIMARY KEYに変更
--       item_codeのUNIQUE制約を削除（重複を許可）

-- 1. 新しいテーブル構造で一時テーブルを作成
CREATE TABLE IF NOT EXISTS estat_ranking_mappings_new (
  stats_data_id TEXT NOT NULL,
  cat01 TEXT NOT NULL,
  item_name TEXT NOT NULL,
  item_code TEXT NOT NULL,
  unit TEXT,
  area_type TEXT NOT NULL DEFAULT 'prefecture',  -- 'prefecture' | 'city' | 'national'
  is_ranking BOOLEAN DEFAULT 0,  -- ランキング変換対象フラグ
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (stats_data_id, cat01),
  CHECK (area_type IN ('prefecture', 'city', 'national'))
);

-- 2. 既存データを新しいテーブルに移行
-- 注意: stats_data_idとcat01の組み合わせが重複している場合は最初の1件のみ移行
INSERT INTO estat_ranking_mappings_new (
  stats_data_id, cat01, item_name, item_code, unit,
  area_type, is_ranking, created_at, updated_at
)
SELECT 
  stats_data_id, cat01, item_name, item_code, unit,
  area_type, is_ranking, created_at, updated_at
FROM estat_ranking_mappings
WHERE (stats_data_id, cat01) IN (
  SELECT stats_data_id, cat01
  FROM estat_ranking_mappings
  GROUP BY stats_data_id, cat01
  HAVING MIN(id)
);

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

