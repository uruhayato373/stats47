-- Migration: Remove id columns and use keys for ranking_items and ranking_groups
-- Date: 2025-01-30
-- Description: ranking_itemsとranking_groupsテーブルからidカラムを削除し、キーベースの設計に変更

-- 1. 既存のranking_itemsテーブルをバックアップ用にリネーム
CREATE TABLE IF NOT EXISTS ranking_items_old AS SELECT * FROM ranking_items;

-- 2. 新しいranking_groupsテーブルを作成（id削除、group_keyをPRIMARY KEYに）
CREATE TABLE IF NOT EXISTS ranking_groups_new (
  group_key TEXT PRIMARY KEY,
  subcategory_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  display_order INTEGER DEFAULT 0,
  is_collapsed BOOLEAN DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 3. 既存データを移行（idを除外）
INSERT INTO ranking_groups_new (group_key, subcategory_id, name, description, icon, display_order, is_collapsed, created_at, updated_at)
SELECT group_key, subcategory_id, name, description, icon, display_order, is_collapsed, created_at, updated_at
FROM ranking_groups;

-- 4. 古いranking_groupsテーブルを削除
DROP TABLE IF EXISTS ranking_groups;

-- 5. 新しいranking_groupsテーブルにリネーム
ALTER TABLE ranking_groups_new RENAME TO ranking_groups;

-- 6. 新しいranking_itemsテーブルを作成（id削除、ranking_keyをPRIMARY KEYに、group_idをgroup_keyに変更）
CREATE TABLE IF NOT EXISTS ranking_items_new (
  ranking_key TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  unit TEXT NOT NULL,
  data_source_id TEXT NOT NULL,
  group_key TEXT,
  display_order_in_group INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT 0,
  map_color_scheme TEXT DEFAULT 'interpolateBlues',
  map_diverging_midpoint TEXT DEFAULT 'zero',
  ranking_direction TEXT DEFAULT 'desc',
  conversion_factor REAL DEFAULT 1,
  decimal_places INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (data_source_id) REFERENCES data_sources(id),
  FOREIGN KEY (group_key) REFERENCES ranking_groups(group_key)
);

-- 7. 既存データを移行（group_idをgroup_keyに変換）
-- 一時マッピングテーブルを作成
CREATE TEMPORARY TABLE id_to_group_key AS
SELECT id, group_key FROM ranking_groups;

-- データを移行（group_idからgroup_keyに変換）
INSERT INTO ranking_items_new (
  ranking_key, label, name, description, unit, data_source_id,
  group_key, display_order_in_group, is_featured, map_color_scheme,
  map_diverging_midpoint, ranking_direction, conversion_factor,
  decimal_places, is_active, created_at, updated_at
)
SELECT 
  ri.ranking_key,
  ri.label,
  ri.name,
  ri.description,
  ri.unit,
  ri.data_source_id,
  rg.group_key,  -- group_idをgroup_keyに変換
  ri.display_order_in_group,
  ri.is_featured,
  ri.map_color_scheme,
  ri.map_diverging_midpoint,
  ri.ranking_direction,
  ri.conversion_factor,
  ri.decimal_places,
  ri.is_active,
  ri.created_at,
  ri.updated_at
FROM ranking_items_old ri
LEFT JOIN id_to_group_key rg ON ri.group_id = rg.id;

-- 8. 古いranking_itemsテーブルを削除
DROP TABLE IF EXISTS ranking_items;

-- 9. 新しいranking_itemsテーブルにリネーム
ALTER TABLE ranking_items_new RENAME TO ranking_items;

-- 10. インデックスを再作成
CREATE INDEX IF NOT EXISTS idx_ranking_items_data_source ON ranking_items(data_source_id);
CREATE INDEX IF NOT EXISTS idx_ranking_items_active ON ranking_items(is_active);
CREATE INDEX IF NOT EXISTS idx_ranking_items_group_key ON ranking_items(group_key);
CREATE INDEX IF NOT EXISTS idx_ranking_groups_subcategory ON ranking_groups(subcategory_id);
CREATE INDEX IF NOT EXISTS idx_ranking_groups_display_order ON ranking_groups(subcategory_id, display_order);

-- 11. 一時テーブルを削除
DROP TABLE IF EXISTS ranking_items_old;
DROP TABLE IF EXISTS id_to_group_key;

