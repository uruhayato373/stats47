-- estat_metainfo_unique ビューの修正
-- stats_data_id ごとに1レコードのみ表示するように変更

DROP VIEW IF EXISTS estat_metainfo_unique;

CREATE VIEW IF NOT EXISTS estat_metainfo_unique AS
SELECT 
  MIN(id) as id,
  stats_data_id, 
  stat_name, 
  title,
  ranking_key,
  MIN(created_at) as created_at,
  MAX(updated_at) as updated_at,
  COUNT(*) as item_count
FROM estat_metainfo
WHERE stats_data_id IS NOT NULL
GROUP BY stats_data_id, stat_name, title;
