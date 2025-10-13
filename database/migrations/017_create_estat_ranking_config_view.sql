-- 017_create_estat_ranking_config_view.sql
-- estat_metainfo と ranking_items を結合したビューを作成
-- stats_data_id と cat01 で ranking_key を取得し、ranking_items の設定情報も含める

CREATE VIEW estat_ranking_config AS
SELECT 
  em.stats_data_id,
  em.cat01,
  em.ranking_key,
  ri.id as ranking_item_id,
  ri.name,
  ri.description,
  ri.unit,
  ri.label,
  ri.data_source_id,
  ri.map_color_scheme,
  ri.map_diverging_midpoint,
  ri.ranking_direction,
  ri.conversion_factor,
  ri.decimal_places,
  ri.is_active,
  ri.created_at,
  ri.updated_at
FROM estat_metainfo em
LEFT JOIN ranking_items ri ON em.ranking_key = ri.ranking_key
WHERE em.ranking_key IS NOT NULL;
