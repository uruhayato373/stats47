-- Migration: Update ranking_items and ranking_groups schema
-- Date: 2025-01-31
-- Description: 
-- - ranking_items: name → ranking_name, description → annotation
-- - ranking_groups: name → group_name, remove description and is_collapsed, add label

-- 外部キー制約を一時的に無効化
PRAGMA foreign_keys = OFF;

BEGIN TRANSACTION;

-- ============================================================================
-- 1. ranking_items の group_key を一時的に NULL に設定（外部キー制約のため）
-- ============================================================================

-- 既存のgroup_keyマッピングを保存
CREATE TABLE IF NOT EXISTS group_key_mapping AS
SELECT DISTINCT group_key, group_key as old_group_key
FROM ranking_items
WHERE group_key IS NOT NULL;

-- group_keyを一時的にNULLに
UPDATE ranking_items SET group_key = NULL WHERE group_key IS NOT NULL;

-- ============================================================================
-- 2. ranking_groups テーブルの更新
-- ============================================================================

-- 2.1 既存データをバックアップ
CREATE TABLE IF NOT EXISTS ranking_groups_backup AS SELECT * FROM ranking_groups;

-- 2.2 新しいranking_groupsテーブルを作成
CREATE TABLE IF NOT EXISTS ranking_groups_new (
  group_key TEXT PRIMARY KEY,
  subcategory_id TEXT NOT NULL,
  group_name TEXT NOT NULL,
  label TEXT,
  icon TEXT,
  display_order INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2.3 既存データを移行（name → group_name, descriptionとis_collapsedを削除）
-- group_keyが存在する場合は使用、存在しない場合はidまたはrowidから生成
INSERT INTO ranking_groups_new (
  group_key, subcategory_id, group_name, label, icon, display_order,
  created_at, updated_at
)
SELECT 
  COALESCE(
    group_key,
    'group-' || CAST(COALESCE(id, rowid) AS TEXT)
  ) as group_key,
  subcategory_id,
  name as group_name,  -- name → group_name
  NULL as label,  -- labelは新規追加（NULLで初期化）
  icon,
  display_order,
  created_at,
  updated_at
FROM ranking_groups_backup;

-- 2.4 古いranking_groupsテーブルを削除
DROP TABLE IF EXISTS ranking_groups;

-- 2.5 新しいranking_groupsテーブルにリネーム
ALTER TABLE ranking_groups_new RENAME TO ranking_groups;

-- ============================================================================
-- 3. ranking_items テーブルの更新
-- ============================================================================

-- 3.1 既存データをバックアップ
CREATE TABLE IF NOT EXISTS ranking_items_backup AS SELECT * FROM ranking_items;

-- 3.2 新しいranking_itemsテーブルを作成
CREATE TABLE IF NOT EXISTS ranking_items_new (
  ranking_key TEXT NOT NULL,
  area_type TEXT NOT NULL,
  label TEXT NOT NULL,
  ranking_name TEXT NOT NULL,
  annotation TEXT,
  unit TEXT NOT NULL,
  group_key TEXT,
  display_order_in_group INTEGER DEFAULT 0,
  map_color_scheme TEXT DEFAULT 'interpolateBlues',
  map_diverging_midpoint TEXT DEFAULT 'zero',
  ranking_direction TEXT DEFAULT 'desc',
  conversion_factor REAL DEFAULT 1,
  decimal_places INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (ranking_key, area_type),
  CHECK (area_type IN ('prefecture', 'city', 'national')),
  FOREIGN KEY (group_key) REFERENCES ranking_groups(group_key)
);

-- 3.3 既存データを移行（name → ranking_name, description → annotation）
INSERT INTO ranking_items_new (
  ranking_key, area_type, label, ranking_name, annotation, unit,
  group_key, display_order_in_group, map_color_scheme, map_diverging_midpoint,
  ranking_direction, conversion_factor, decimal_places, is_active,
  created_at, updated_at
)
SELECT 
  ranking_key,
  area_type,
  label,
  name as ranking_name,  -- name → ranking_name
  description as annotation,  -- description → annotation
  unit,
  NULL as group_key,  -- 一時的にNULL（後で復元）
  display_order_in_group,
  map_color_scheme,
  map_diverging_midpoint,
  ranking_direction,
  conversion_factor,
  decimal_places,
  is_active,
  created_at,
  updated_at
FROM ranking_items_backup;

-- 3.4 古いranking_itemsテーブルを削除
DROP TABLE IF EXISTS ranking_items;

-- 3.5 新しいranking_itemsテーブルにリネーム
ALTER TABLE ranking_items_new RENAME TO ranking_items;

-- 3.6 group_keyを復元（group_key_mappingから）
UPDATE ranking_items
SET group_key = (
  SELECT old_group_key
  FROM group_key_mapping
  WHERE ranking_items.ranking_key = group_key_mapping.group_key
  LIMIT 1
)
WHERE EXISTS (
  SELECT 1
  FROM group_key_mapping
  WHERE ranking_items.ranking_key = group_key_mapping.group_key
);

COMMIT;

-- インデックスを再作成
CREATE INDEX IF NOT EXISTS idx_ranking_items_active ON ranking_items(is_active);
CREATE INDEX IF NOT EXISTS idx_ranking_items_group_key ON ranking_items(group_key);
CREATE INDEX IF NOT EXISTS idx_ranking_items_area_type ON ranking_items(area_type);
CREATE INDEX IF NOT EXISTS idx_ranking_groups_subcategory ON ranking_groups(subcategory_id);
CREATE INDEX IF NOT EXISTS idx_ranking_groups_display_order ON ranking_groups(subcategory_id, display_order);

-- 一時テーブルを削除
DROP TABLE IF EXISTS ranking_items_backup;
DROP TABLE IF EXISTS ranking_groups_backup;
DROP TABLE IF EXISTS group_key_mapping;

-- 外部キー制約を再有効化
PRAGMA foreign_keys = ON;
