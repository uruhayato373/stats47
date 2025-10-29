-- カテゴリとサブカテゴリのseedデータ
-- 生成日: 2025-01-28
-- データソース: src/config/categories.json
-- カテゴリ数: 16

-- ========================================
-- カテゴリの作成
-- ========================================
INSERT OR REPLACE INTO categories (
  category_key, name, icon, display_order, created_at, updated_at
) VALUES
  ('landweather', '国土・気象', 'MapPin', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('population', '人口・世帯', 'Users', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('laborwage', '労働・賃金', 'TrendingUp', 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('agriculture', '農林水産業', 'Sprout', 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('miningindustry', '鉱工業', 'Factory', 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('commercial', '商業・サービス業', 'Store', 5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('economy', '企業・家計・経済', 'PieChart', 6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('construction', '住宅・土地・建設', 'Home', 7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('energy', 'エネルギー・水', 'Droplets', 8, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('tourism', '運輸・観光', 'Plane', 9, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('educationsports', '教育・文化・スポーツ', 'GraduationCap', 10, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('administrativefinancial', '行財政', 'Building2', 11, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('safetyenvironment', '司法・安全・環境', 'ShieldCheck', 12, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('socialsecurity', '社会保障・衛生', 'Hospital', 13, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('international', '国際', 'Globe', 14, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('infrastructure', '社会基盤施設', 'Construction', 15, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- ========================================
-- サブカテゴリの作成
-- ========================================
INSERT OR REPLACE INTO subcategories (
  subcategory_key, name, category_id, display_order, created_at, updated_at
) VALUES
  ('land-area', '土地面積', (SELECT id FROM categories WHERE category_key = 'landweather'), 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('land-use', '土地利用', (SELECT id FROM categories WHERE category_key = 'landweather'), 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('natural-environment', '自然環境', (SELECT id FROM categories WHERE category_key = 'landweather'), 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('weather-climate', '気象・気候', (SELECT id FROM categories WHERE category_key = 'landweather'), 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('basic-population', '総人口', (SELECT id FROM categories WHERE category_key = 'population'), 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('population-movement', '人口移動', (SELECT id FROM categories WHERE category_key = 'population'), 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('population-composition', '人口構成', (SELECT id FROM categories WHERE category_key = 'population'), 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('marriage', '婚姻・家族', (SELECT id FROM categories WHERE category_key = 'population'), 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('households', '世帯', (SELECT id FROM categories WHERE category_key = 'population'), 5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('birth-death', '出生・死亡', (SELECT id FROM categories WHERE category_key = 'population'), 6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('wages-working-conditions', '賃金・労働条件', (SELECT id FROM categories WHERE category_key = 'laborwage'), 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('labor-force-structure', '労働力構造', (SELECT id FROM categories WHERE category_key = 'laborwage'), 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('industrial-structure', '産業構造', (SELECT id FROM categories WHERE category_key = 'laborwage'), 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('commuting-employment', '通勤・就職', (SELECT id FROM categories WHERE category_key = 'laborwage'), 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('labor-disputes', '労働争議', (SELECT id FROM categories WHERE category_key = 'laborwage'), 5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('job-seeking-placement', '求職・求人', (SELECT id FROM categories WHERE category_key = 'laborwage'), 6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('industry-occupation', '産業・職業別', (SELECT id FROM categories WHERE category_key = 'laborwage'), 7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('employment-type', '雇用形態', (SELECT id FROM categories WHERE category_key = 'laborwage'), 8, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('agricultural-household', '農業世帯', (SELECT id FROM categories WHERE category_key = 'agriculture'), 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('manufacturing', '製造業', (SELECT id FROM categories WHERE category_key = 'miningindustry'), 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('commerce-service-industry', '商業・サービス産業', (SELECT id FROM categories WHERE category_key = 'commercial'), 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('commercial-facilities', '商業施設', (SELECT id FROM categories WHERE category_key = 'commercial'), 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('worker-household-income', '労働者世帯収入', (SELECT id FROM categories WHERE category_key = 'economy'), 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('household-economy', '家計', (SELECT id FROM categories WHERE category_key = 'economy'), 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('business-scale', '企業規模', (SELECT id FROM categories WHERE category_key = 'economy'), 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('business-activity', '企業活動', (SELECT id FROM categories WHERE category_key = 'economy'), 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('gross-product-economic-indicators', '総生産・経済指標', (SELECT id FROM categories WHERE category_key = 'economy'), 5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('consumer-price-difference-index', '消費者物価地域差指数', (SELECT id FROM categories WHERE category_key = 'economy'), 6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('living-environment', '生活環境', (SELECT id FROM categories WHERE category_key = 'construction'), 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('housing-ownership', '住宅所有', (SELECT id FROM categories WHERE category_key = 'construction'), 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('housing-structure', '住宅構造', (SELECT id FROM categories WHERE category_key = 'construction'), 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('housing-facilities', '住宅設備', (SELECT id FROM categories WHERE category_key = 'construction'), 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('construction-manufacturing', '建設・製造', (SELECT id FROM categories WHERE category_key = 'construction'), 5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('welfare-facilities', '福祉施設', (SELECT id FROM categories WHERE category_key = 'construction'), 6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('housing-statistics', '住宅統計', (SELECT id FROM categories WHERE category_key = 'construction'), 7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('water-supply-sewerage', '上水道・下水道', (SELECT id FROM categories WHERE category_key = 'energy'), 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('waste-management', '廃棄物処理', (SELECT id FROM categories WHERE category_key = 'energy'), 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('industrial-water', '工業用水', (SELECT id FROM categories WHERE category_key = 'energy'), 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('infrastructure-energy', 'インフラ・エネルギー', (SELECT id FROM categories WHERE category_key = 'energy'), 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('tourism-accommodation', '観光・宿泊', (SELECT id FROM categories WHERE category_key = 'tourism'), 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('kindergarten', '幼稚園', (SELECT id FROM categories WHERE category_key = 'educationsports'), 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('elementary-school', '小学校', (SELECT id FROM categories WHERE category_key = 'educationsports'), 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('junior-high-school', '中学校', (SELECT id FROM categories WHERE category_key = 'educationsports'), 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('high-school', '高等学校', (SELECT id FROM categories WHERE category_key = 'educationsports'), 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('college-university', '短大・大学', (SELECT id FROM categories WHERE category_key = 'educationsports'), 5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('cultural-facilities', '文化施設', (SELECT id FROM categories WHERE category_key = 'educationsports'), 6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('sports-facilities', 'スポーツ施設', (SELECT id FROM categories WHERE category_key = 'educationsports'), 7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('social-activities', '社会活動', (SELECT id FROM categories WHERE category_key = 'educationsports'), 8, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('childcare-early-education', '保育・幼児教育', (SELECT id FROM categories WHERE category_key = 'educationsports'), 9, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('compulsory-education', '義務教育', (SELECT id FROM categories WHERE category_key = 'educationsports'), 10, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('fiscal-indicators', '財政指標', (SELECT id FROM categories WHERE category_key = 'administrativefinancial'), 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('staff-assembly-election', '職員・議会・選挙', (SELECT id FROM categories WHERE category_key = 'administrativefinancial'), 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('tax-revenue', '税収', (SELECT id FROM categories WHERE category_key = 'administrativefinancial'), 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('investment', '投資', (SELECT id FROM categories WHERE category_key = 'administrativefinancial'), 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('revenue', '歳入', (SELECT id FROM categories WHERE category_key = 'administrativefinancial'), 5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('expenditure', '歳出', (SELECT id FROM categories WHERE category_key = 'administrativefinancial'), 6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('fire-emergency', '消防・緊急事態', (SELECT id FROM categories WHERE category_key = 'safetyenvironment'), 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('fire-insurance', '火災保険', (SELECT id FROM categories WHERE category_key = 'safetyenvironment'), 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('police-crime', '警察・犯罪', (SELECT id FROM categories WHERE category_key = 'safetyenvironment'), 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('traffic-accidents', '交通事故', (SELECT id FROM categories WHERE category_key = 'safetyenvironment'), 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pollution-environment', '公害・環境', (SELECT id FROM categories WHERE category_key = 'safetyenvironment'), 5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('card', '社会保障指標', (SELECT id FROM categories WHERE category_key = 'socialsecurity'), 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('death-statistics', '死亡統計', (SELECT id FROM categories WHERE category_key = 'socialsecurity'), 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('public-assistance-welfare', '生活保護・福祉', (SELECT id FROM categories WHERE category_key = 'socialsecurity'), 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('health-care', '健康・保健', (SELECT id FROM categories WHERE category_key = 'socialsecurity'), 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('foreign-population', '外国人人口', (SELECT id FROM categories WHERE category_key = 'international'), 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('foreigners', '外国人統計', (SELECT id FROM categories WHERE category_key = 'international'), 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('roads', '道路', (SELECT id FROM categories WHERE category_key = 'infrastructure'), 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
