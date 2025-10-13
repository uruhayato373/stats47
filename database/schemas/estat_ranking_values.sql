-- e-Statランキングデータキャッシュテーブル
-- APIから取得した都道府県ランキングデータをキャッシュ
-- 作成日: 2025-01-XX

CREATE TABLE IF NOT EXISTS estat_ranking_values (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  
  -- データ識別
  stats_data_id TEXT NOT NULL,      -- 統計表ID
  area_code TEXT NOT NULL,          -- 地域コード
  
  -- データ値
  value TEXT NOT NULL,              -- 元の値（文字列）
  numeric_value REAL,               -- 数値
  display_value TEXT,               -- 表示用の値
  rank INTEGER,                     -- ランキング順位
  unit TEXT,                        -- 単位
  
  -- メタデータ
  area_name TEXT,                   -- 地域名
  category_code TEXT,               -- カテゴリコード（cdCat01）
  category_name TEXT,               -- カテゴリ名
  time_code TEXT,                   -- 時間コード（年度）
  time_name TEXT,                   -- 時間名
  
  -- システム情報
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  -- 一意制約
  UNIQUE(stats_data_id, category_code, time_code, area_code)
);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_estat_ranking_lookup 
  ON estat_ranking_values(stats_data_id, category_code, time_code);
CREATE INDEX IF NOT EXISTS idx_estat_ranking_area 
  ON estat_ranking_values(area_code);
