-- リモートD1からローカルD1へのデータ同期スクリプト
-- 作成日: 2025-01-13
-- 目的: リモートD1の完全なデータをローカルD1に同期

-- 1. ranking_items のデータ同期
INSERT INTO ranking_items (
  ranking_key, label, name, description, unit, data_source_id,
  map_color_scheme, map_diverging_midpoint, ranking_direction,
  conversion_factor, decimal_places, is_active, created_at, updated_at
)
SELECT
  ranking_key, label, name, description, unit, data_source_id,
  map_color_scheme, map_diverging_midpoint, ranking_direction,
  conversion_factor, decimal_places, is_active, created_at, updated_at
FROM ranking_items_old_backup;

-- 2. data_source_metadata のデータ同期
INSERT INTO data_source_metadata (ranking_item_id, data_source_id, metadata, created_at, updated_at)
SELECT
  ri_local.id,
  dsm_remote.data_source_id,
  dsm_remote.metadata,
  dsm_remote.created_at,
  dsm_remote.updated_at
FROM data_source_metadata dsm_remote
JOIN ranking_items_old_backup ri_remote ON dsm_remote.ranking_item_id = ri_remote.id
JOIN ranking_items ri_local ON ri_remote.ranking_key = ri_local.ranking_key;

-- 3. subcategory_ranking_items のデータ同期
INSERT INTO subcategory_ranking_items (subcategory_id, ranking_item_id, display_order, is_default, created_at)
SELECT
  sri_remote.subcategory_id,
  ri_local.id,
  sri_remote.display_order,
  sri_remote.is_default,
  sri_remote.created_at
FROM subcategory_ranking_items sri_remote
JOIN ranking_items_old_backup ri_remote ON sri_remote.ranking_item_id = ri_remote.id
JOIN ranking_items ri_local ON ri_remote.ranking_key = ri_local.ranking_key;

-- 4. ranking_values のデータ同期
INSERT INTO ranking_values (
  ranking_key, area_code, area_name, time_code, time_name,
  value, numeric_value, display_value, rank, created_at, updated_at
)
SELECT
  rv_remote.ranking_key,
  rv_remote.area_code,
  rv_remote.area_name,
  rv_remote.time_code,
  rv_remote.time_name,
  rv_remote.value,
  rv_remote.numeric_value,
  rv_remote.display_value,
  rv_remote.rank,
  rv_remote.created_at,
  rv_remote.updated_at
FROM ranking_values rv_remote;

-- 5. データ整合性確認
SELECT 
  'ranking_items' as table_name,
  COUNT(*) as count
FROM ranking_items;

SELECT 
  'data_source_metadata' as table_name,
  COUNT(*) as count
FROM data_source_metadata;

SELECT 
  'subcategory_ranking_items' as table_name,
  COUNT(*) as count
FROM subcategory_ranking_items;

SELECT 
  'ranking_values' as table_name,
  COUNT(*) as count
FROM ranking_values;
