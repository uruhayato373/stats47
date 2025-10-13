-- default_ranking_keyに基づいてis_defaultフラグを設定
UPDATE subcategory_ranking_items
SET is_default = 1
WHERE (subcategory_id, ranking_item_id) IN (
  SELECT sri.subcategory_id, sri.ranking_item_id
  FROM subcategory_ranking_items sri
  JOIN ranking_items ri ON sri.ranking_item_id = ri.id
  JOIN subcategory_configs sc ON sri.subcategory_id = sc.id
  WHERE ri.ranking_key = sc.default_ranking_key
);

-- 確認クエリ
SELECT sri.subcategory_id, ri.ranking_key, sri.is_default
FROM subcategory_ranking_items sri
JOIN ranking_items ri ON sri.ranking_item_id = ri.id
WHERE sri.is_default = 1
ORDER BY sri.subcategory_id;
