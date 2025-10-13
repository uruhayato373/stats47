-- データベーススキーマ リファクタリング - フェーズ2: データ移行
-- 作成日: 2025-01-13
-- 目的: 既存データを新スキーマに移行

-- 1. ranking_items のデータ移行（重複を処理）
INSERT INTO ranking_items_new (
  ranking_key, label, name, description, unit, data_source_id,
  map_color_scheme, map_diverging_midpoint, ranking_direction,
  conversion_factor, decimal_places, is_active, created_at, updated_at
)
SELECT
  CASE 
    WHEN COUNT(*) OVER (PARTITION BY ranking_key) > 1 
    THEN ranking_key || '_' || ROW_NUMBER() OVER (PARTITION BY ranking_key ORDER BY id)
    ELSE ranking_key 
  END as ranking_key,
  label,
  name,
  NULL as description, -- 既存データにはないため
  unit,
  'estat' as data_source_id, -- すべてe-Stat由来
  'interpolateBlues' as map_color_scheme, -- デフォルト値
  'zero' as map_diverging_midpoint, -- デフォルト値
  'desc' as ranking_direction, -- デフォルト値
  1 as conversion_factor, -- デフォルト値
  0 as decimal_places, -- デフォルト値
  COALESCE(is_active, 1) as is_active,
  COALESCE(created_at, CURRENT_TIMESTAMP) as created_at,
  COALESCE(updated_at, CURRENT_TIMESTAMP) as updated_at
FROM ranking_items;

-- 2. data_source_metadata にe-Stat固有情報を移行
INSERT INTO data_source_metadata (ranking_item_id, data_source_id, metadata)
SELECT
  ri_new.id,
  'estat',
  json_object(
    'stats_data_id', ri_old.stats_data_id,
    'cd_cat01', ri_old.cd_cat01
  )
FROM ranking_items ri_old
JOIN ranking_items_new ri_new ON ri_old.id = ri_new.id;

-- 3. subcategory_ranking_items に多対多関係を移行
INSERT INTO subcategory_ranking_items (
  subcategory_id, ranking_item_id, display_order, is_default
)
SELECT
  ri_old.subcategory_id,
  ri_new.id,
  COALESCE(ri_old.display_order, 0) as display_order,
  CASE 
    WHEN sc.default_ranking_key = ri_old.ranking_key THEN 1 
    ELSE 0 
  END as is_default
FROM ranking_items ri_old
JOIN ranking_items_new ri_new ON ri_old.id = ri_new.id
LEFT JOIN subcategory_configs sc ON ri_old.subcategory_id = sc.id;

-- 4. estat_ranking_values を ranking_values に移行
-- 注意: estat_ranking_values にデータがない場合はスキップ
INSERT INTO ranking_values (
  ranking_key, area_code, area_name, time_code, time_name,
  value, numeric_value, display_value, rank, created_at, updated_at
)
SELECT
  ri_new.ranking_key,
  erv.area_code,
  erv.area_name,
  erv.time_code,
  erv.time_name,
  erv.value,
  erv.numeric_value,
  erv.display_value,
  erv.rank,
  COALESCE(erv.created_at, CURRENT_TIMESTAMP) as created_at,
  COALESCE(erv.updated_at, CURRENT_TIMESTAMP) as updated_at
FROM estat_ranking_values erv
JOIN ranking_items ri_old ON
  ri_old.stats_data_id = erv.stats_data_id
  AND ri_old.cd_cat01 = erv.category_code
JOIN ranking_items_new ri_new ON ri_old.id = ri_new.id;

-- 5. subcategory_configs の default_ranking_key を default_ranking_item_id に移行
-- 注意: SQLiteでは ALTER TABLE でカラムを追加する必要がある
-- この部分は別途実行する必要がある場合がある

-- 6. データ整合性チェック用のクエリ（実行結果を確認）
-- 旧テーブルと新テーブルの件数比較
SELECT
  'ranking_items' as table_name,
  (SELECT COUNT(*) FROM ranking_items) as old_count,
  (SELECT COUNT(*) FROM ranking_items_new) as new_count;

SELECT
  'ranking_values' as table_name,
  (SELECT COUNT(*) FROM estat_ranking_values) as old_count,
  (SELECT COUNT(*) FROM ranking_values) as new_count;

-- 7. 移行されたデータのサンプル確認
SELECT 
  'ranking_items_new' as table_name,
  COUNT(*) as count,
  GROUP_CONCAT(ranking_key) as sample_keys
FROM ranking_items_new;

SELECT 
  'data_source_metadata' as table_name,
  COUNT(*) as count,
  GROUP_CONCAT(json_extract(metadata, '$.stats_data_id')) as sample_stats_data_ids
FROM data_source_metadata;

SELECT 
  'subcategory_ranking_items' as table_name,
  COUNT(*) as count
FROM subcategory_ranking_items;
