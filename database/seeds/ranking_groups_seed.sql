-- ランキンググループのseedデータ
-- 生成日: 2025-11-02
-- データソース: ローカルD1データベース
-- グループ数: 35

-- ========================================
-- ランキンググループの作成
-- ========================================

-- バッチ 1 / 1

INSERT OR REPLACE INTO ranking_groups (

  group_key, group_name, label, display_order,

  created_at, updated_at

) VALUES

  ('aging-index', '老年化指数', '老年化指数', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('agricultural-income-ratio', '農業所得割合', '農業所得割合', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('agricultural-output-per-employed-person', '就業者1人当たり農業産出額（販売農家）', '就業者1人当たり農業産出額（販売農家）', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('annual-precipitation', '降水量（年間）', '降水量（年間）', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('annual-sales-amount-per-employee', '商業年間商品販売額（卸売業＋小売業）（従業者1人当たり）', '商業年間商品販売額（卸売業＋小売業）（従業者1人当たり）', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('average-persons-per-general-household', '一般世帯の平均人員', '一般世帯の平均人員', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('average-relative-humidity', '年平均相対湿度', '年平均相対湿度', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('average-temperature', '年平均気温', '年平均気温', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('bank-deposit-balance-per-person', '国内銀行預金残高（人口1人当たり）', '国内銀行預金残高（人口1人当たり）', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('block-park-count-per-100km2', '街区公園数（可住地面積100km2当たり）', '街区公園数（可住地面積100km2当たり）', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('building-fire-count-per-100-thousand-people', '火災出火件数（人口10万人当たり）', '火災出火件数（人口10万人当たり）', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('city-gas-sales-volume', '都市ガス販売量', '都市ガス販売量', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('city-gas-supply-area-household-ratio', '都市ガス供給区域内世帯比率', '都市ガス供給区域内世帯比率', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('complainant-rate-per-1000', '有訴者率（人口千人当たり）', '有訴者率（人口千人当たり）', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('criminal-arrest-rate', '刑法犯検挙率', '刑法犯検挙率', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('criminal-recognition-count-of-serious-crime-rate', '刑法犯認知件数に占める凶悪犯の割合', '刑法犯認知件数に占める凶悪犯の割合', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('crude-birth-rate', '粗出生率（人口千人当たり）', '粗出生率（人口千人当たり）', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('crude-death-rate', '粗死亡率（人口千人当たり）', '粗死亡率（人口千人当たり）', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('cultivated-land-area-ratio', '耕地面積比率', 'null', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('day-time-population-ratio', '昼夜間人口比率', 'null', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('densely-inhabited-district-population-density', '人口集中地区人口密度（人口集中地区面積１km2当たり）', 'null', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('densely-inhabited-district-population-ratio', '人口集中地区人口比率', 'null', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('densely-populated-area-change-rate', '人口集中地区面積の変化率', 'null', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('densely-populated-area-ratio', '人口集中地区面積比率', 'null', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('dependent-population-index', '従属人口指数', 'null', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('deposit-balance-per-person', '預貯金残高（人口1人当たり）', 'null', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('divorces-per-total-population', '離婚率（人口千人当たり）', 'null', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('dual-income-household-ratio', '共働き世帯割合', 'null', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('electricity-generation-capacity', '発電電力量', 'null', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('elementary-school-count-per-100k-6-11', '小学校数（6～11歳人口10万人当たり）', 'null', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('elementary-school-students-per-teacher', '小学校児童数（教員1人当たり）', 'null', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('employed-people-ratio', '就業者比率', 'null', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('employee-ratio', '雇用者比率', 'null', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('employment-insurance-receipt-rate', '雇用保険受給率', 'null', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('total-population', '総人口', 'null', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
;

