-- ランキング項目のseedデータ
-- 生成日: 2025-11-02
-- データソース: ローカルD1データベース
-- 項目数: 35

-- 注意: ranking_itemsテーブルはR2→D1同期機能で自動生成・更新されます
-- このseedファイルは開発環境での初期データ投入用です

-- ========================================
-- ランキング項目の作成
-- ========================================

-- バッチ 1 / 1

INSERT OR REPLACE INTO ranking_items (

  ranking_key, area_type, label, ranking_name, annotation, unit,

  group_key, display_order_in_group,

  map_color_scheme, map_diverging_midpoint, ranking_direction,

  conversion_factor, decimal_places, is_active,

  created_at, updated_at

) VALUES

  ('aging-index', 'prefecture', '老年化指数', '老年化指数', NULL, '‐', 'aging-index', 0, 'interpolateBlues', 'zero', 'desc', 1, 0, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('agricultural-income-ratio', 'prefecture', '農業所得割合', '農業所得割合', NULL, '％', 'agricultural-income-ratio', 0, 'interpolateBlues', 'zero', 'desc', 1, 0, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('agricultural-output-per-employed-person', 'prefecture', '就業者1人当たり農業産出額（販売農家）', '就業者1人当たり農業産出額（販売農家）', NULL, '万円', 'agricultural-output-per-employed-person', 0, 'interpolateBlues', 'zero', 'desc', 1, 0, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('annual-precipitation', 'prefecture', '降水量（年間）', '降水量（年間）', NULL, 'mm', 'annual-precipitation', 0, 'interpolateBlues', 'zero', 'desc', 1, 0, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('annual-sales-amount-per-employee', 'prefecture', '商業年間商品販売額（卸売業＋小売業）（従業者1人当たり）', '商業年間商品販売額（卸売業＋小売業）（従業者1人当たり）', NULL, '万円', 'annual-sales-amount-per-employee', 0, 'interpolateBlues', 'zero', 'desc', 1, 0, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('average-persons-per-general-household', 'prefecture', '一般世帯の平均人員', '一般世帯の平均人員', NULL, '人', 'average-persons-per-general-household', 0, 'interpolateBlues', 'zero', 'desc', 1, 0, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('average-relative-humidity', 'prefecture', '年平均相対湿度', '年平均相対湿度', NULL, '％', 'average-relative-humidity', 0, 'interpolateBlues', 'zero', 'desc', 1, 0, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('average-temperature', 'prefecture', '年平均気温', '年平均気温', NULL, 'ﾟC', 'average-temperature', 0, 'interpolateBlues', 'zero', 'desc', 1, 0, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('bank-deposit-balance-per-person', 'prefecture', '国内銀行預金残高（人口1人当たり）', '国内銀行預金残高（人口1人当たり）', NULL, '万円', 'bank-deposit-balance-per-person', 0, 'interpolateBlues', 'zero', 'desc', 1, 0, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('block-park-count-per-100km2', 'prefecture', '街区公園数（可住地面積100km2当たり）', '街区公園数（可住地面積100km2当たり）', NULL, '所', 'block-park-count-per-100km2', 0, 'interpolateBlues', 'zero', 'desc', 1, 0, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('building-fire-count-per-100-thousand-people', 'prefecture', '火災出火件数（人口10万人当たり）', '火災出火件数（人口10万人当たり）', NULL, '件', 'building-fire-count-per-100-thousand-people', 0, 'interpolateBlues', 'zero', 'desc', 1, 0, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('city-gas-sales-volume', 'prefecture', '都市ガス販売量', '都市ガス販売量', NULL, '万ＭＪ', 'city-gas-sales-volume', 0, 'interpolateBlues', 'zero', 'desc', 1, 0, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('city-gas-supply-area-household-ratio', 'prefecture', '都市ガス供給区域内世帯比率', '都市ガス供給区域内世帯比率', NULL, '％', 'city-gas-supply-area-household-ratio', 0, 'interpolateBlues', 'zero', 'desc', 1, 0, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('complainant-rate-per-1000', 'prefecture', '有訴者率（人口千人当たり）', '有訴者率（人口千人当たり）', NULL, '‐', 'complainant-rate-per-1000', 0, 'interpolateBlues', 'zero', 'desc', 1, 0, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('criminal-arrest-rate', 'prefecture', '刑法犯検挙率', '刑法犯検挙率', NULL, '％', 'criminal-arrest-rate', 0, 'interpolateBlues', 'zero', 'desc', 1, 0, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('criminal-recognition-count-of-serious-crime-rate', 'prefecture', '刑法犯認知件数に占める凶悪犯の割合', '刑法犯認知件数に占める凶悪犯の割合', NULL, '％', 'criminal-recognition-count-of-serious-crime-rate', 0, 'interpolateBlues', 'zero', 'desc', 1, 0, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('crude-birth-rate', 'prefecture', '粗出生率（人口千人当たり）', '粗出生率（人口千人当たり）', NULL, '‐', 'crude-birth-rate', 0, 'interpolateBlues', 'zero', 'desc', 1, 0, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('crude-death-rate', 'prefecture', '粗死亡率（人口千人当たり）', '粗死亡率（人口千人当たり）', NULL, '‐', 'crude-death-rate', 0, 'interpolateBlues', 'zero', 'desc', 1, 0, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('cultivated-land-area-ratio', 'prefecture', '耕地面積比率', '耕地面積比率', NULL, '％', 'cultivated-land-area-ratio', 0, 'interpolateBlues', 'zero', 'desc', 1, 0, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('day-time-population-ratio', 'prefecture', '昼夜間人口比率', '昼夜間人口比率', NULL, '％', 'day-time-population-ratio', 0, 'interpolateBlues', 'zero', 'desc', 1, 0, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('densely-inhabited-district-population-density', 'prefecture', '人口集中地区人口密度（人口集中地区面積１km2当たり）', '人口集中地区人口密度（人口集中地区面積１km2当たり）', NULL, '人', 'densely-inhabited-district-population-density', 0, 'interpolateBlues', 'zero', 'desc', 1, 0, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('densely-inhabited-district-population-ratio', 'prefecture', '人口集中地区人口比率', '人口集中地区人口比率', NULL, '％', 'densely-inhabited-district-population-ratio', 0, 'interpolateBlues', 'zero', 'desc', 1, 0, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('densely-populated-area-change-rate', 'prefecture', '人口集中地区面積の変化率', '人口集中地区面積の変化率', NULL, '％', 'densely-populated-area-change-rate', 0, 'interpolateBlues', 'zero', 'desc', 1, 0, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('densely-populated-area-ratio', 'prefecture', '人口集中地区面積比率', '人口集中地区面積比率', NULL, '％', 'densely-populated-area-ratio', 0, 'interpolateBlues', 'zero', 'desc', 1, 0, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('dependent-population-index', 'prefecture', '従属人口指数', '従属人口指数', NULL, '‐', 'dependent-population-index', 0, 'interpolateBlues', 'zero', 'desc', 1, 0, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('deposit-balance-per-person', 'prefecture', '預貯金残高（人口1人当たり）', '預貯金残高（人口1人当たり）', NULL, '万円', 'deposit-balance-per-person', 0, 'interpolateBlues', 'zero', 'desc', 1, 0, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('divorces-per-total-population', 'prefecture', '離婚率（人口千人当たり）', '離婚率（人口千人当たり）', NULL, '‐', 'divorces-per-total-population', 0, 'interpolateBlues', 'zero', 'desc', 1, 0, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('dual-income-household-ratio', 'prefecture', '共働き世帯割合', '共働き世帯割合', NULL, '％', 'dual-income-household-ratio', 0, 'interpolateBlues', 'zero', 'desc', 1, 0, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('electricity-generation-capacity', 'prefecture', '発電電力量', '発電電力量', NULL, 'Ｍｗｈ', 'electricity-generation-capacity', 0, 'interpolateBlues', 'zero', 'desc', 1, 0, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('elementary-school-count-per-100k-6-11', 'prefecture', '小学校数（6～11歳人口10万人当たり）', '小学校数（6～11歳人口10万人当たり）', NULL, '校', 'elementary-school-count-per-100k-6-11', 0, 'interpolateBlues', 'zero', 'desc', 1, 0, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('elementary-school-students-per-teacher', 'prefecture', '小学校児童数（教員1人当たり）', '小学校児童数（教員1人当たり）', NULL, '人', 'elementary-school-students-per-teacher', 0, 'interpolateBlues', 'zero', 'desc', 1, 0, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('employed-people-ratio', 'prefecture', '就業者比率', '就業者比率', NULL, '％', 'employed-people-ratio', 0, 'interpolateBlues', 'zero', 'desc', 1, 0, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('employee-ratio', 'prefecture', '雇用者比率', '雇用者比率', NULL, '％', 'employee-ratio', 0, 'interpolateBlues', 'zero', 'desc', 1, 0, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('employment-insurance-receipt-rate', 'prefecture', '雇用保険受給率', '雇用保険受給率', NULL, '％', 'employment-insurance-receipt-rate', 0, 'interpolateBlues', 'zero', 'desc', 1, 0, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('total-population', 'city', '総人口', '総人口', NULL, '人', 'total-population', 0, 'interpolateBlues', 'zero', 'desc', 1, 0, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
;

