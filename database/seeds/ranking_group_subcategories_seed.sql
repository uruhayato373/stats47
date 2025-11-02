-- ランキンググループとサブカテゴリの関連付けseedデータ
-- 生成日: 2025-11-02
-- データソース: ローカルD1データベース
-- 関連付け数: 36

-- ========================================
-- ランキンググループとサブカテゴリの関連付け
-- ========================================

-- バッチ 1 / 1

INSERT OR REPLACE INTO ranking_group_subcategories (

  group_key, subcategory_id, display_order,

  created_at

) VALUES

  ('aging-index', 'population-composition', 0, CURRENT_TIMESTAMP),
  ('agricultural-income-ratio', 'agricultural-household', 0, CURRENT_TIMESTAMP),
  ('agricultural-output-per-employed-person', 'agricultural-household', 0, CURRENT_TIMESTAMP),
  ('annual-precipitation', 'weather-climate', 0, CURRENT_TIMESTAMP),
  ('annual-sales-amount-per-employee', 'commerce-service-industry', 0, CURRENT_TIMESTAMP),
  ('average-persons-per-general-household', 'households', 0, CURRENT_TIMESTAMP),
  ('average-relative-humidity', 'weather-climate', 0, CURRENT_TIMESTAMP),
  ('average-temperature', 'weather-climate', 0, CURRENT_TIMESTAMP),
  ('bank-deposit-balance-per-person', 'household-economy', 0, CURRENT_TIMESTAMP),
  ('block-park-count-per-100km2', 'land-area', 0, CURRENT_TIMESTAMP),
  ('building-fire-count-per-100-thousand-people', 'fire-insurance', 0, CURRENT_TIMESTAMP),
  ('building-fire-count-per-100-thousand-people', 'basic-population', 1, CURRENT_TIMESTAMP),
  ('city-gas-sales-volume', 'infrastructure-energy', 0, CURRENT_TIMESTAMP),
  ('city-gas-supply-area-household-ratio', 'infrastructure-energy', 0, CURRENT_TIMESTAMP),
  ('complainant-rate-per-1000', 'health-care', 0, CURRENT_TIMESTAMP),
  ('criminal-arrest-rate', 'police-crime', 0, CURRENT_TIMESTAMP),
  ('criminal-recognition-count-of-serious-crime-rate', 'police-crime', 0, CURRENT_TIMESTAMP),
  ('crude-birth-rate', 'birth-death', 0, CURRENT_TIMESTAMP),
  ('crude-death-rate', 'birth-death', 0, CURRENT_TIMESTAMP),
  ('cultivated-land-area-ratio', 'uncategorized', 0, CURRENT_TIMESTAMP),
  ('day-time-population-ratio', 'uncategorized', 0, CURRENT_TIMESTAMP),
  ('densely-inhabited-district-population-density', 'uncategorized', 0, CURRENT_TIMESTAMP),
  ('densely-inhabited-district-population-ratio', 'uncategorized', 0, CURRENT_TIMESTAMP),
  ('densely-populated-area-change-rate', 'uncategorized', 0, CURRENT_TIMESTAMP),
  ('densely-populated-area-ratio', 'uncategorized', 0, CURRENT_TIMESTAMP),
  ('dependent-population-index', 'uncategorized', 0, CURRENT_TIMESTAMP),
  ('deposit-balance-per-person', 'uncategorized', 0, CURRENT_TIMESTAMP),
  ('divorces-per-total-population', 'uncategorized', 0, CURRENT_TIMESTAMP),
  ('dual-income-household-ratio', 'uncategorized', 0, CURRENT_TIMESTAMP),
  ('electricity-generation-capacity', 'uncategorized', 0, CURRENT_TIMESTAMP),
  ('elementary-school-count-per-100k-6-11', 'uncategorized', 0, CURRENT_TIMESTAMP),
  ('elementary-school-students-per-teacher', 'uncategorized', 0, CURRENT_TIMESTAMP),
  ('employed-people-ratio', 'uncategorized', 0, CURRENT_TIMESTAMP),
  ('employee-ratio', 'uncategorized', 0, CURRENT_TIMESTAMP),
  ('employment-insurance-receipt-rate', 'uncategorized', 0, CURRENT_TIMESTAMP),
  ('total-population', 'uncategorized', 0, CURRENT_TIMESTAMP)
;

