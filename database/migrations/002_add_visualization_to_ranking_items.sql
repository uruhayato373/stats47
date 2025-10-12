-- ステップ1: ranking_itemsに可視化設定カラムを追加
ALTER TABLE ranking_items ADD COLUMN map_color_scheme TEXT DEFAULT 'interpolateBlues';
ALTER TABLE ranking_items ADD COLUMN map_diverging_midpoint TEXT DEFAULT 'zero';
ALTER TABLE ranking_items ADD COLUMN ranking_direction TEXT DEFAULT 'desc';
ALTER TABLE ranking_items ADD COLUMN conversion_factor REAL DEFAULT 1;
ALTER TABLE ranking_items ADD COLUMN decimal_places INTEGER DEFAULT 0;

-- ステップ2: ranking_visualizationsからデータを移行（該当するものがあれば）
UPDATE ranking_items
SET
  map_color_scheme = (
    SELECT rv.map_color_scheme
    FROM ranking_visualizations rv
    WHERE rv.stats_data_id = ranking_items.stats_data_id
      AND rv.cat01 = ranking_items.cd_cat01
  ),
  map_diverging_midpoint = (
    SELECT rv.map_diverging_midpoint
    FROM ranking_visualizations rv
    WHERE rv.stats_data_id = ranking_items.stats_data_id
      AND rv.cat01 = ranking_items.cd_cat01
  ),
  ranking_direction = (
    SELECT rv.ranking_direction
    FROM ranking_visualizations rv
    WHERE rv.stats_data_id = ranking_items.stats_data_id
      AND rv.cat01 = ranking_items.cd_cat01
  ),
  conversion_factor = (
    SELECT rv.conversion_factor
    FROM ranking_visualizations rv
    WHERE rv.stats_data_id = ranking_items.stats_data_id
      AND rv.cat01 = ranking_items.cd_cat01
  ),
  decimal_places = (
    SELECT rv.decimal_places
    FROM ranking_visualizations rv
    WHERE rv.stats_data_id = ranking_items.stats_data_id
      AND rv.cat01 = ranking_items.cd_cat01
  )
WHERE EXISTS (
  SELECT 1 FROM ranking_visualizations rv
  WHERE rv.stats_data_id = ranking_items.stats_data_id
    AND rv.cat01 = ranking_items.cd_cat01
);

-- ステップ3: 確認クエリ（実行はしない、確認用）
-- SELECT
--   id, subcategory_id, ranking_key, stats_data_id, cd_cat01,
--   map_color_scheme, conversion_factor, decimal_places
-- FROM ranking_items
-- WHERE map_color_scheme != 'interpolateBlues'
-- LIMIT 10;
