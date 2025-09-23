-- ランキング可視化設定データベーススキーマ
-- 都道府県ランキングサイト用の設定管理
-- 作成日: 2025-09-23

-- ランキング可視化設定テーブル
CREATE TABLE IF NOT EXISTS ranking_visualizations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,

  -- データ識別（複合キー）
  stats_data_id TEXT NOT NULL,         -- 統計表ID
  cat01 TEXT NOT NULL,                 -- カテゴリコード（estat_metainfoのcat01と対応）

  -- 地図可視化設定
  map_color_scheme TEXT DEFAULT 'interpolateBlues',
  map_diverging_midpoint TEXT DEFAULT 'zero',

  -- ランキング設定
  ranking_direction TEXT DEFAULT 'desc', -- 'asc', 'desc'

  -- 単位変換設定
  conversion_factor REAL DEFAULT 1,    -- 変換係数（元データ × 係数 = 表示値）
  decimal_places INTEGER DEFAULT 0,    -- 小数点以下桁数

  -- システム情報
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  -- 一意制約
  UNIQUE(stats_data_id, cat01)
);

-- インデックスの作成
CREATE INDEX IF NOT EXISTS idx_ranking_viz_stats_id ON ranking_visualizations(stats_data_id);
CREATE INDEX IF NOT EXISTS idx_ranking_viz_cat01 ON ranking_visualizations(cat01);
CREATE UNIQUE INDEX IF NOT EXISTS idx_ranking_viz_composite ON ranking_visualizations(stats_data_id, cat01);

-- メタデータ付きランキング設定ビュー
CREATE VIEW IF NOT EXISTS v_ranking_with_metadata AS
SELECT
  rv.*,
  m.stat_name,
  m.title,
  m.unit as original_unit,
  m.item_name
FROM ranking_visualizations rv
LEFT JOIN estat_metainfo m ON rv.stats_data_id = m.stats_data_id AND rv.cat01 = m.cat01;

-- サンプルデータの挿入
-- 実際の運用では管理画面から設定

-- 例: GDP（百万円）を億円で表示
INSERT OR IGNORE INTO ranking_visualizations (stats_data_id, cat01, conversion_factor, decimal_places, map_color_scheme, ranking_direction)
VALUES ('0003448368', 'A110101', 0.01, 1, 'interpolateBlues', 'desc');

-- 例: 人口（千人）を万人で表示
INSERT OR IGNORE INTO ranking_visualizations (stats_data_id, cat01, conversion_factor, decimal_places, map_color_scheme, ranking_direction)
VALUES ('0003448368', 'A110102', 0.1, 1, 'interpolateGreens', 'desc');

-- 例: 高齢化率（比率）をパーセント表示
INSERT OR IGNORE INTO ranking_visualizations (stats_data_id, cat01, conversion_factor, decimal_places, map_color_scheme, ranking_direction)
VALUES ('0003448368', 'A110103', 100, 1, 'interpolateRdYlBu', 'desc');

-- 例: 面積（平方キロメートル）をそのまま表示
INSERT OR IGNORE INTO ranking_visualizations (stats_data_id, cat01, conversion_factor, decimal_places, map_color_scheme, ranking_direction)
VALUES ('0003448368', 'A110104', 1, 0, 'interpolateOranges', 'desc');