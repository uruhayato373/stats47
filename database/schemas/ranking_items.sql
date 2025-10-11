-- ランキング設定データベーススキーマ
-- サブカテゴリとランキング項目の設定を管理
-- 作成日: 2025-01-XX

-- サブカテゴリ設定テーブル
CREATE TABLE IF NOT EXISTS subcategory_configs (
  id TEXT PRIMARY KEY,              -- 'land-area', 'land-use'
  category_id TEXT NOT NULL,        -- 'landweather'
  name TEXT NOT NULL,               -- '土地面積', '土地利用'
  description TEXT,
  default_ranking_key TEXT,         -- デフォルトの統計項目
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ランキング項目テーブル
CREATE TABLE IF NOT EXISTS ranking_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  subcategory_id TEXT NOT NULL,     -- 'land-area', 'land-use'
  ranking_key TEXT NOT NULL,        -- 'totalAreaExcluding'など
  label TEXT NOT NULL,              -- '総面積（除く）'
  stats_data_id TEXT NOT NULL,      -- '0000010102'
  cd_cat01 TEXT NOT NULL,           -- 'B1101'
  unit TEXT NOT NULL,               -- 'ha'
  name TEXT NOT NULL,               -- '総面積（北方地域及び竹島を除く）'
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(subcategory_id, ranking_key)
);

-- インデックスの作成
CREATE INDEX IF NOT EXISTS idx_subcategory_configs_category ON subcategory_configs(category_id);
CREATE INDEX IF NOT EXISTS idx_ranking_items_subcategory ON ranking_items(subcategory_id);
CREATE INDEX IF NOT EXISTS idx_ranking_items_active ON ranking_items(is_active);
CREATE INDEX IF NOT EXISTS idx_ranking_items_display_order ON ranking_items(display_order);
CREATE UNIQUE INDEX IF NOT EXISTS idx_ranking_items_unique ON ranking_items(subcategory_id, ranking_key);

-- ランキング設定ビュー（サブカテゴリとランキング項目を結合）
CREATE VIEW IF NOT EXISTS v_ranking_configs AS
SELECT 
  sc.id as subcategory_id,
  sc.category_id,
  sc.name as subcategory_name,
  sc.description,
  sc.default_ranking_key,
  ri.ranking_key,
  ri.label,
  ri.stats_data_id,
  ri.cd_cat01,
  ri.unit,
  ri.name as ranking_name,
  ri.display_order,
  ri.is_active,
  ri.created_at,
  ri.updated_at
FROM subcategory_configs sc
LEFT JOIN ranking_items ri ON sc.id = ri.subcategory_id AND ri.is_active = 1
ORDER BY sc.id, ri.display_order;

-- サンプルデータの挿入
-- サブカテゴリ設定
INSERT OR IGNORE INTO subcategory_configs (id, category_id, name, description, default_ranking_key)
VALUES 
  ('land-area', 'landweather', '土地面積', '都道府県別の土地面積統計', 'totalAreaExcluding'),
  ('land-use', 'landweather', '土地利用', '都道府県別の土地利用統計', 'agriculturalLand');

-- land-area のランキング項目
INSERT OR IGNORE INTO ranking_items (subcategory_id, ranking_key, label, stats_data_id, cd_cat01, unit, name, display_order)
VALUES 
  ('land-area', 'totalAreaExcluding', '総面積（除く）', '0000010102', 'B1101', 'ha', '総面積（北方地域及び竹島を除く）', 1),
  ('land-area', 'totalAreaIncluding', '総面積（含む）', '0000010102', 'B1102', 'ha', '総面積（北方地域及び竹島を含む）', 2),
  ('land-area', 'habitableArea', '可住地面積', '0000010102', 'B1103', 'ha', '可住地面積', 3),
  ('land-area', 'majorLakeArea', '主要湖沼面積', '0000010102', 'B1104', 'ha', '主要湖沼面積', 4),
  ('land-area', 'totalAreaIncludingRatio', '総面積（100km²）', '0000010202', '#B011001', '100km²', '総面積（北方地域及び竹島を含む）', 5),
  ('land-area', 'areaRatio', '面積割合', '0000010202', '#B01101', '%', '面積割合（全国面積に占める割合）', 6),
  ('land-area', 'habitableAreaRatio', '可住地面積割合', '0000010202', '#B01301', '%', '可住地面積割合', 7);

-- land-use のランキング項目
INSERT OR IGNORE INTO ranking_items (subcategory_id, ranking_key, label, stats_data_id, cd_cat01, unit, name, display_order)
VALUES 
  ('land-use', 'agriculturalLand', '農用地', '0000010201', '#A01201', 'ha', '農用地', 1),
  ('land-use', 'forestLand', '森林', '0000010201', '#A01202', 'ha', '森林', 2),
  ('land-use', 'residentialLand', '宅地', '0000010201', '#A01203', 'ha', '宅地', 3),
  ('land-use', 'commercialLand', '商業地', '0000010201', '#A01204', 'ha', '商業地', 4),
  ('land-use', 'industrialLand', '工業地', '0000010201', '#A01205', 'ha', '工業地', 5),
  ('land-use', 'agriculturalLandRatio', '農用地割合', '0000010201', '#A01206', '%', '農用地割合', 6),
  ('land-use', 'forestLandRatio', '森林割合', '0000010201', '#A01207', '%', '森林割合', 7),
  ('land-use', 'residentialLandRatio', '宅地割合', '0000010201', '#A01208', '%', '宅地割合', 8);
