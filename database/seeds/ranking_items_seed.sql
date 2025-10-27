-- ランキング項目とサブカテゴリのマッピングデータ
-- 作成日: 2025-10-27

-- 1. ranking_items_new にデータを投入
INSERT INTO ranking_items_new (
  id, ranking_key, label, name, description, unit, data_source_id,
  map_color_scheme, map_diverging_midpoint, ranking_direction,
  conversion_factor, decimal_places, is_active, created_at, updated_at
) VALUES
  (1, 'accommodations', '宿泊施設数', '宿泊施設数', '宿泊施設の総数', '施設', 'estat',
   'interpolateBlues', 'zero', 'desc', 1, 0, 1, '2025-10-11 00:20:14', '2025-10-11 00:20:14'),
  (2, 'adultClassLecture', '成人一般学級・講座数（人口100万人当たり）', '成人一般学級・講座数（人口100万人当たり）', '成人向けの学級・講座数を人口100万人当たりで算出', '学級・講座', 'estat',
   'interpolateBlues', 'zero', 'desc', 1, 0, 1, '2025-10-11 00:20:14', '2025-10-11 00:20:14'),
  (3, 'agriculturalHouseholds', '農業世帯数', '農業世帯数', '農業を営む世帯の総数', '世帯', 'estat',
   'interpolateBlues', 'zero', 'desc', 1, 0, 1, '2025-10-11 00:20:14', '2025-10-11 00:20:14'),
  (4, 'agriculturalLand', '農用地', '農用地', '農業に使用される土地の総面積', 'ha', 'estat',
   'interpolateBlues', 'zero', 'desc', 1, 0, 1, '2025-10-11 00:07:51', '2025-10-11 00:07:51'),
  (5, 'agriculturalLandRatio', '農用地割合', '農用地割合', '総面積に占める農用地の割合', '%', 'estat',
   'interpolateBlues', 'zero', 'desc', 1, 0, 1, '2025-10-11 00:07:51', '2025-10-11 00:07:51'),
  (6, 'areaRatio', '面積割合', '面積割合（全国面積に占める割合）', '全国面積に占める都道府県の面積割合', '%', 'estat',
   'interpolateBlues', 'zero', 'desc', 1, 0, 1, '2025-10-11 00:07:51', '2025-10-11 00:07:51'),
  (7, 'averageHouseholdSize', '平均世帯人員', '平均世帯人員', '1世帯あたりの平均人員数', '人', 'estat',
   'interpolateBlues', 'zero', 'desc', 1, 0, 1, '2025-10-11 00:20:14', '2025-10-11 00:20:14'),
  (8, 'averageIncome', '平均収入', '平均収入', '世帯の平均収入', '円', 'estat',
   'interpolateBlues', 'zero', 'desc', 1, 0, 1, '2025-10-11 00:20:14', '2025-10-11 00:20:14'),
  (9, 'avgTemperature', '年平均気温', '年平均気温', '年間の平均気温', '℃', 'estat',
   'interpolateBlues', 'zero', 'desc', 1, 0, 1, '2025-10-11 00:20:14', '2025-10-11 00:20:14'),
  (10, 'birthRate', '出生率', '出生率', '人口1000人当たりの出生数', '‰', 'estat',
   'interpolateBlues', 'zero', 'desc', 1, 0, 1, '2025-10-11 00:20:14', '2025-10-11 00:20:14');

-- 2. data_source_metadata にe-Stat固有情報を投入（仮データ）
INSERT INTO data_source_metadata (ranking_item_id, data_source_id, metadata) VALUES
  (1, 'estat', '{"stats_data_id": "0003411595", "cd_cat01": "A1101"}'),
  (2, 'estat', '{"stats_data_id": "0003411595", "cd_cat01": "A1102"}'),
  (3, 'estat', '{"stats_data_id": "0003411595", "cd_cat01": "A1103"}'),
  (4, 'estat', '{"stats_data_id": "0000010101", "cd_cat01": "B1101"}'),
  (5, 'estat', '{"stats_data_id": "0000010101", "cd_cat01": "B1102"}'),
  (6, 'estat', '{"stats_data_id": "0000010101", "cd_cat01": "B1103"}'),
  (7, 'estat', '{"stats_data_id": "0000020201", "cd_cat01": "C1101"}'),
  (8, 'estat', '{"stats_data_id": "0000020201", "cd_cat01": "C1102"}'),
  (9, 'estat', '{"stats_data_id": "0000030301", "cd_cat01": "D1101"}'),
  (10, 'estat', '{"stats_data_id": "0000020201", "cd_cat01": "E1101"}');

-- 3. subcategory_ranking_items にマッピングを投入
-- land-area: 面積関連
INSERT INTO subcategory_ranking_items (subcategory_id, ranking_item_id, display_order, is_default) VALUES
  ('land-area', 6, 1, 1);  -- areaRatio (デフォルト)

-- land-use: 土地利用関連
INSERT INTO subcategory_ranking_items (subcategory_id, ranking_item_id, display_order, is_default) VALUES
  ('land-use', 4, 1, 1),   -- agriculturalLand (デフォルト)
  ('land-use', 5, 2, 0);   -- agriculturalLandRatio

-- weather-climate: 気象・気候関連
INSERT INTO subcategory_ranking_items (subcategory_id, ranking_item_id, display_order, is_default) VALUES
  ('weather-climate', 9, 1, 1);  -- avgTemperature (デフォルト)

-- households: 世帯関連
INSERT INTO subcategory_ranking_items (subcategory_id, ranking_item_id, display_order, is_default) VALUES
  ('households', 7, 1, 1);  -- averageHouseholdSize (デフォルト)

-- birth-death: 出生・死亡関連
INSERT INTO subcategory_ranking_items (subcategory_id, ranking_item_id, display_order, is_default) VALUES
  ('birth-death', 10, 1, 1);  -- birthRate (デフォルト)

-- agricultural-household: 農業世帯関連
INSERT INTO subcategory_ranking_items (subcategory_id, ranking_item_id, display_order, is_default) VALUES
  ('agricultural-household', 3, 1, 1);  -- agriculturalHouseholds (デフォルト)

-- household-economy: 家計関連
INSERT INTO subcategory_ranking_items (subcategory_id, ranking_item_id, display_order, is_default) VALUES
  ('household-economy', 8, 1, 1);  -- averageIncome (デフォルト)

-- 確認用クエリ
SELECT
  sri.subcategory_id,
  sri.display_order,
  sri.is_default,
  ri.ranking_key,
  ri.label
FROM subcategory_ranking_items sri
JOIN ranking_items_new ri ON sri.ranking_item_id = ri.id
ORDER BY sri.subcategory_id, sri.display_order;
