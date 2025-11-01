-- ============================================================================
-- マイグレーション: estat_ranking_mappings テーブル作成
-- ============================================================================
-- 作成日: 2025-01-XX
-- 説明: e-Stat APIパラメータとランキング項目のマッピングテーブル
--       CSVファイル（data/prefectures.csv）からインポートするデータを保存
--       isRankingフラグでランキング変換対象を指定

-- estat_ranking_mappings: e-Statランキングマッピングテーブル
CREATE TABLE IF NOT EXISTS estat_ranking_mappings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  stats_data_id TEXT NOT NULL,
  cat01 TEXT NOT NULL,
  item_name TEXT NOT NULL,
  item_code TEXT NOT NULL,
  unit TEXT,
  dividing_value TEXT,
  new_unit TEXT,
  ascending BOOLEAN DEFAULT 0,
  is_ranking BOOLEAN DEFAULT 0,  -- ランキング変換対象フラグ
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(stats_data_id, cat01, item_code)
);

-- インデックス追加（検索パフォーマンス向上）
CREATE INDEX IF NOT EXISTS idx_estat_ranking_mappings_stats_data_id 
  ON estat_ranking_mappings(stats_data_id);
CREATE INDEX IF NOT EXISTS idx_estat_ranking_mappings_is_ranking 
  ON estat_ranking_mappings(is_ranking);
CREATE INDEX IF NOT EXISTS idx_estat_ranking_mappings_item_code 
  ON estat_ranking_mappings(item_code);

