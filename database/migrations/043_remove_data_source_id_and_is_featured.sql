-- ============================================================================
-- マイグレーション: ranking_itemsテーブルからdata_source_idとis_featuredを削除
-- ============================================================================
-- 作成日: 2025-01-31
-- 説明: ranking_itemsテーブルはe-Stat API専用のため、data_source_idは不要
--       is_featured（おすすめ機能）も不要なため削除

-- ============================================================================
-- 1. 既存テーブルをバックアップ（必要なカラムのみを明示的に選択）
-- ============================================================================

CREATE TABLE IF NOT EXISTS ranking_items_backup AS 
SELECT 
  ranking_key,
  area_type,
  label,
  name,
  description,
  unit,
  group_key,
  display_order_in_group,
  map_color_scheme,
  map_diverging_midpoint,
  ranking_direction,
  conversion_factor,
  decimal_places,
  is_active,
  created_at,
  updated_at
FROM ranking_items;

-- ============================================================================
-- 2. 新しいranking_itemsテーブルを作成（data_source_idとis_featuredなし）
-- ============================================================================

CREATE TABLE IF NOT EXISTS ranking_items_new (
  ranking_key TEXT NOT NULL,
  area_type TEXT NOT NULL,  -- 'prefecture' | 'city' | 'national'
  label TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
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

-- ============================================================================
-- 3. 既存データを新しいテーブルに移行
-- ============================================================================

INSERT INTO ranking_items_new (
  ranking_key, area_type, label, name, description, unit,
  group_key, display_order_in_group, map_color_scheme,
  map_diverging_midpoint, ranking_direction, conversion_factor,
  decimal_places, is_active, created_at, updated_at
)
SELECT 
  ri.ranking_key,
  ri.area_type,
  ri.label,
  ri.name,
  ri.description,
  ri.unit,
  ri.group_key,
  ri.display_order_in_group,
  ri.map_color_scheme,
  ri.map_diverging_midpoint,
  ri.ranking_direction,
  ri.conversion_factor,
  ri.decimal_places,
  ri.is_active,
  ri.created_at,
  ri.updated_at
FROM ranking_items_backup ri;

-- ============================================================================
-- 4. 古いranking_itemsテーブルを削除
-- ============================================================================

DROP TABLE IF EXISTS ranking_items;

-- ============================================================================
-- 5. 新しいranking_itemsテーブルにリネーム
-- ============================================================================

ALTER TABLE ranking_items_new RENAME TO ranking_items;

-- ============================================================================
-- 6. インデックスを再作成
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_ranking_items_active ON ranking_items(is_active);
CREATE INDEX IF NOT EXISTS idx_ranking_items_group_key ON ranking_items(group_key);
CREATE INDEX IF NOT EXISTS idx_ranking_items_area_type ON ranking_items(area_type);

-- ============================================================================
-- 7. バックアップテーブルを削除（オプション）
-- ============================================================================

-- 本番環境ではバックアップテーブルを残しておくことを推奨
-- DROP TABLE IF EXISTS ranking_items_backup;
