-- estat_metainfo テーブルから stats_data_id で重複を除いたビュー
-- 各統計表IDに対して、最新の情報とアイテム数を集約
CREATE VIEW IF NOT EXISTS estat_metainfo_unique AS
SELECT 
  MIN(id) as id,
  stats_data_id, 
  stat_name, 
  title,
  cat01,
  item_name,
  unit,
  ranking_key,
  MIN(created_at) as created_at,
  MAX(updated_at) as updated_at,
  COUNT(*) as item_count
FROM estat_metainfo
WHERE stats_data_id IS NOT NULL
GROUP BY stats_data_id, stat_name, title, cat01, item_name, unit, ranking_key;
