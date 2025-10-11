-- ランキング項目シードデータ
-- 開発・テスト環境用のサンプルデータ
-- 作成日: 2025-01-XX

-- 既存データをクリア（開発環境のみ）
-- DELETE FROM ranking_items WHERE subcategory_id IN ('land-area', 'land-use');
-- DELETE FROM subcategory_configs WHERE id IN ('land-area', 'land-use');

-- サブカテゴリ設定の挿入
INSERT OR REPLACE INTO subcategory_configs (id, category_id, name, description, default_ranking_key)
VALUES 
  ('land-area', 'landweather', '土地面積', '都道府県別の土地面積統計', 'totalAreaExcluding'),
  ('land-use', 'landweather', '土地利用', '都道府県別の土地利用統計', 'agriculturalLand');

-- land-area のランキング項目
INSERT OR REPLACE INTO ranking_items (subcategory_id, ranking_key, label, stats_data_id, cd_cat01, unit, name, display_order)
VALUES 
  ('land-area', 'totalAreaExcluding', '総面積（除く）', '0000010102', 'B1101', 'ha', '総面積（北方地域及び竹島を除く）', 1),
  ('land-area', 'totalAreaIncluding', '総面積（含む）', '0000010102', 'B1102', 'ha', '総面積（北方地域及び竹島を含む）', 2),
  ('land-area', 'habitableArea', '可住地面積', '0000010102', 'B1103', 'ha', '可住地面積', 3),
  ('land-area', 'majorLakeArea', '主要湖沼面積', '0000010102', 'B1104', 'ha', '主要湖沼面積', 4),
  ('land-area', 'totalAreaIncludingRatio', '総面積（100km²）', '0000010202', '#B011001', '100km²', '総面積（北方地域及び竹島を含む）', 5),
  ('land-area', 'areaRatio', '面積割合', '0000010202', '#B01101', '%', '面積割合（全国面積に占める割合）', 6),
  ('land-area', 'habitableAreaRatio', '可住地面積割合', '0000010202', '#B01301', '%', '可住地面積割合', 7);

-- land-use のランキング項目
INSERT OR REPLACE INTO ranking_items (subcategory_id, ranking_key, label, stats_data_id, cd_cat01, unit, name, display_order)
VALUES 
  ('land-use', 'agriculturalLand', '農用地', '0000010201', '#A01201', 'ha', '農用地', 1),
  ('land-use', 'forestLand', '森林', '0000010201', '#A01202', 'ha', '森林', 2),
  ('land-use', 'residentialLand', '宅地', '0000010201', '#A01203', 'ha', '宅地', 3),
  ('land-use', 'commercialLand', '商業地', '0000010201', '#A01204', 'ha', '商業地', 4),
  ('land-use', 'industrialLand', '工業地', '0000010201', '#A01205', 'ha', '工業地', 5),
  ('land-use', 'agriculturalLandRatio', '農用地割合', '0000010201', '#A01206', '%', '農用地割合', 6),
  ('land-use', 'forestLandRatio', '森林割合', '0000010201', '#A01207', '%', '森林割合', 7),
  ('land-use', 'residentialLandRatio', '宅地割合', '0000010201', '#A01208', '%', '宅地割合', 8);

-- データ確認クエリ
-- SELECT 
--   sc.name as subcategory_name,
--   ri.ranking_key,
--   ri.label,
--   ri.stats_data_id,
--   ri.cd_cat01,
--   ri.unit,
--   ri.display_order
-- FROM subcategory_configs sc
-- LEFT JOIN ranking_items ri ON sc.id = ri.subcategory_id
-- ORDER BY sc.id, ri.display_order;
