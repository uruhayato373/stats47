-- ランキング項目のシードデータ
-- 作成日: 2025-10-27
-- 更新日: 2025-01-28 (現在のスキーマに合わせて修正)

-- 1. ranking_groups にサブカテゴリごとのグループを作成
INSERT OR REPLACE INTO ranking_groups (
  id, group_key, subcategory_id, name, description, display_order
) VALUES
  (1, 'land-area-default', 'land-area', '面積関連', '都道府県の面積に関する指標', 1),
  (2, 'land-use-default', 'land-use', '土地利用', '農用地の利用状況に関する指標', 1),
  (3, 'weather-climate-default', 'weather-climate', '気象・気候', '気温などの気象データ', 1),
  (4, 'households-default', 'households', '世帯', '世帯構成に関する指標', 1),
  (5, 'birth-death-default', 'birth-death', '出生・死亡', '人口動態に関する指標', 1),
  (6, 'agricultural-household-default', 'agricultural-household', '農業世帯', '農業世帯に関する指標', 1),
  (7, 'household-economy-default', 'household-economy', '家計', '家計に関する指標', 1);

-- 2. ranking_items にデータを投入
-- 注意: group_id は対応する ranking_groups の id を参照
INSERT OR REPLACE INTO ranking_items (
  id, ranking_key, label, name, description, unit, data_source_id, group_id,
  display_order_in_group, map_color_scheme, map_diverging_midpoint, ranking_direction,
  conversion_factor, decimal_places, is_active, created_at, updated_at
) VALUES
  (1, 'accommodations', '宿泊施設数', '宿泊施設数', '宿泊施設の総数', '施設', 'estat', NULL,
   0, 'interpolateBlues', 'zero', 'desc', 1, 0, 1, '2025-10-11 00:20:14', '2025-10-11 00:20:14'),
  (2, 'adultClassLecture', '成人一般学級・講座数（人口100万人当たり）', '成人一般学級・講座数（人口100万人当たり）', '成人向けの学級・講座数を人口100万人当たりで算出', '学級・講座', 'estat', NULL,
   0, 'interpolateBlues', 'zero', 'desc', 1, 0, 1, '2025-10-11 00:20:14', '2025-10-11 00:20:14'),
  (3, 'agriculturalHouseholds', '農業世帯数', '農業世帯数', '農業を営む世帯の総数', '世帯', 'estat', 6,
   1, 'interpolateBlues', 'zero', 'desc', 1, 0, 1, '2025-10-11 00:20:14', '2025-10-11 00:20:14'),
  (4, 'agriculturalLand', '農用地', '農用地', '農業に使用される土地の総面積', 'ha', 'estat', 2,
   1, 'interpolateBlues', 'zero', 'desc', 1, 0, 1, '2025-10-11 00:07:51', '2025-10-11 00:07:51'),
  (5, 'agriculturalLandRatio', '農用地割合', '農用地割合', '総面積に占める農用地の割合', '%', 'estat', 2,
   2, 'interpolateBlues', 'zero', 'desc', 1, 0, 1, '2025-10-11 00:07:51', '2025-10-11 00:07:51'),
  (6, 'areaRatio', '面積割合', '面積割合（全国面積に占める割合）', '全国面積に占める都道府県の面積割合', '%', 'estat', 1,
   1, 'interpolateBlues', 'zero', 'desc', 1, 0, 1, '2025-10-11 00:07:51', '2025-10-11 00:07:51'),
  (7, 'averageHouseholdSize', '平均世帯人員', '平均世帯人員', '1世帯あたりの平均人員数', '人', 'estat', 4,
   1, 'interpolateBlues', 'zero', 'desc', 1, 0, 1, '2025-10-11 00:20:14', '2025-10-11 00:20:14'),
  (8, 'averageIncome', '平均収入', '平均収入', '世帯の平均収入', '円', 'estat', 7,
   1, 'interpolateBlues', 'zero', 'desc', 1, 0, 1, '2025-10-11 00:20:14', '2025-10-11 00:20:14'),
  (9, 'avgTemperature', '年平均気温', '年平均気温', '年間の平均気温', '℃', 'estat', 3,
   1, 'interpolateBlues', 'zero', 'desc', 1, 0, 1, '2025-10-11 00:20:14', '2025-10-11 00:20:14'),
  (10, 'birthRate', '出生率', '出生率', '人口1000人当たりの出生数', '‰', 'estat', 5,
   1, 'interpolateBlues', 'zero', 'desc', 1, 0, 1, '2025-10-11 00:20:14', '2025-10-11 00:20:14');

-- 3. data_source_metadata にe-Stat固有情報を投入
-- area_type: 'prefecture' | 'city' | 'national'
-- calculation_type: 'direct' | 'ratio' | 'aggregate'
INSERT OR REPLACE INTO data_source_metadata (
  ranking_item_id, data_source_id, area_type, calculation_type, metadata
) VALUES
  (1, 'estat', 'prefecture', 'direct', '{"stats_data_id": "0003411595", "cd_cat01": "A1101"}'),
  (2, 'estat', 'prefecture', 'direct', '{"stats_data_id": "0003411595", "cd_cat01": "A1102"}'),
  (3, 'estat', 'prefecture', 'direct', '{"stats_data_id": "0003411595", "cd_cat01": "A1103"}'),
  (4, 'estat', 'prefecture', 'direct', '{"stats_data_id": "0000010101", "cd_cat01": "B1101"}'),
  (5, 'estat', 'prefecture', 'direct', '{"stats_data_id": "0000010101", "cd_cat01": "B1102"}'),
  (6, 'estat', 'prefecture', 'direct', '{"stats_data_id": "0000010101", "cd_cat01": "B1103"}'),
  (7, 'estat', 'prefecture', 'direct', '{"stats_data_id": "0000020201", "cd_cat01": "C1101"}'),
  (8, 'estat', 'prefecture', 'direct', '{"stats_data_id": "0000020201", "cd_cat01": "C1102"}'),
  (9, 'estat', 'prefecture', 'direct', '{"stats_data_id": "0000030301", "cd_cat01": "D1101"}'),
  (10, 'estat', 'prefecture', 'direct', '{"stats_data_id": "0000020201", "cd_cat01": "E1101"}');

-- 確認用クエリ: グループとランキング項目の関連を表示
SELECT
  rg.group_key,
  rg.name as group_name,
  rg.subcategory_id,
  ri.id as item_id,
  ri.ranking_key,
  ri.label,
  ri.display_order_in_group
FROM ranking_groups rg
LEFT JOIN ranking_items ri ON rg.id = ri.group_id
ORDER BY rg.subcategory_id, ri.display_order_in_group;
