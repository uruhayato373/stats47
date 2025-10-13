-- estat_metainfo テーブルから stats_data_id で重複を除いたビュー（修正版）
-- 各統計表IDに対して、最新の情報とアイテム数を集約
-- 統計表IDごとに1つのレコードのみを表示

DROP VIEW IF EXISTS estat_metainfo_unique;

CREATE VIEW IF NOT EXISTS estat_metainfo_unique AS
SELECT 
  MIN(id) as id,
  stats_data_id, 
  stat_name, 
  title,
  NULL as cat01,  -- カテゴリは個別に表示しない
  NULL as item_name,  -- 項目名は個別に表示しない
  NULL as unit,  -- 単位は個別に表示しない
  NULL as ranking_key,  -- ランキングキーは個別に表示しない
  MIN(created_at) as created_at,
  MAX(updated_at) as updated_at,
  COUNT(*) as item_count
FROM estat_metainfo
WHERE stats_data_id IS NOT NULL
GROUP BY stats_data_id, stat_name, title;
