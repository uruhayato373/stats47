-- subcategory_configsの全データを確認
SELECT sc.id, sc.name, sc.category_id, sc.default_ranking_key,
       COUNT(sri.id) as ranking_items_count
FROM subcategory_configs sc
LEFT JOIN subcategory_ranking_items sri ON sc.id = sri.subcategory_id
GROUP BY sc.id
ORDER BY sc.id;

-- default_ranking_keyに対応するranking_itemsの確認
SELECT sc.id as subcategory_id, sc.default_ranking_key,
       ri.id as ranking_item_id, ri.ranking_key
FROM subcategory_configs sc
LEFT JOIN ranking_items ri ON sc.default_ranking_key = ri.ranking_key
WHERE sc.default_ranking_key IS NOT NULL;
