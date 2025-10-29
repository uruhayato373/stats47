-- カテゴリとサブカテゴリのseedデータ
-- 生成日: 2025-01-28
-- データソース: src/config/categories.json
-- カテゴリ数: 16

-- ========================================
-- カテゴリの作成
-- ========================================
INSERT OR REPLACE INTO categories (
  category_key, name, icon, display_order, is_active, created_at, updated_at
) VALUES
  ('landweather', '国土・気象', 'MapPin', 0, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('population', '人口・世帯', 'Users', 1, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('laborwage', '労働・賃金', 'TrendingUp', 2, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('agriculture', '農林水産業', 'Sprout', 3, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('miningindustry', '鉱工業', 'Factory', 4, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('commercial', '商業・サービス業', 'Store', 5, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('economy', '企業・家計・経済', 'PieChart', 6, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('construction', '住宅・土地・建設', 'Home', 7, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('energy', 'エネルギー・水', 'Droplets', 8, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('tourism', '運輸・観光', 'Plane', 9, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('educationsports', '教育・文化・スポーツ', 'GraduationCap', 10, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('administrativefinancial', '行財政', 'Building2', 11, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('safetyenvironment', '司法・安全・環境', 'ShieldCheck', 12, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('socialsecurity', '社会保障・衛生', 'Hospital', 13, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('international', '国際', 'Globe', 14, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('infrastructure', '社会基盤施設', 'Construction', 15, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- ========================================
-- サブカテゴリの作成
-- ========================================
INSERT OR REPLACE INTO subcategories (
  subcategory_key, name, category_id, href, display_order, is_active, created_at, updated_at
) VALUES
  ('land-area', '土地面積', (SELECT id FROM categories WHERE category_key = 'landweather'), '/land-area', 1, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('land-use', '土地利用', (SELECT id FROM categories WHERE category_key = 'landweather'), '/land-use', 2, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('natural-environment', '自然環境', (SELECT id FROM categories WHERE category_key = 'landweather'), '/natural-environment', 3, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('weather-climate', '気象・気候', (SELECT id FROM categories WHERE category_key = 'landweather'), '/weather-climate', 4, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('basic-population', '総人口', (SELECT id FROM categories WHERE category_key = 'population'), '/basic-population', 1, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('population-movement', '人口移動', (SELECT id FROM categories WHERE category_key = 'population'), '/population-movement', 2, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('population-composition', '人口構成', (SELECT id FROM categories WHERE category_key = 'population'), '/population-composition', 3, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('marriage', '婚姻・家族', (SELECT id FROM categories WHERE category_key = 'population'), '/marriage', 4, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('households', '世帯', (SELECT id FROM categories WHERE category_key = 'population'), '/households', 5, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('birth-death', '出生・死亡', (SELECT id FROM categories WHERE category_key = 'population'), '/birth-death', 6, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('wages-working-conditions', '賃金・労働条件', (SELECT id FROM categories WHERE category_key = 'laborwage'), '/wages-working-conditions', 1, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('labor-force-structure', '労働力構造', (SELECT id FROM categories WHERE category_key = 'laborwage'), '/labor-force-structure', 2, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('industrial-structure', '産業構造', (SELECT id FROM categories WHERE category_key = 'laborwage'), '/industrial-structure', 3, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('commuting-employment', '通勤・就職', (SELECT id FROM categories WHERE category_key = 'laborwage'), '/commuting-employment', 4, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('labor-disputes', '労働争議', (SELECT id FROM categories WHERE category_key = 'laborwage'), '/labor-disputes', 5, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('job-seeking-placement', '求職・求人', (SELECT id FROM categories WHERE category_key = 'laborwage'), '/job-seeking-placement', 6, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('industry-occupation', '産業・職業別', (SELECT id FROM categories WHERE category_key = 'laborwage'), '/industry-occupation', 7, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('employment-type', '雇用形態', (SELECT id FROM categories WHERE category_key = 'laborwage'), '/employment-type', 8, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('agricultural-household', '農業世帯', (SELECT id FROM categories WHERE category_key = 'agriculture'), '/agricultural-household', 1, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('manufacturing', '製造業', (SELECT id FROM categories WHERE category_key = 'miningindustry'), '/manufacturing', 1, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('commerce-service-industry', '商業・サービス産業', (SELECT id FROM categories WHERE category_key = 'commercial'), '/commerce-service-industry', 1, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('commercial-facilities', '商業施設', (SELECT id FROM categories WHERE category_key = 'commercial'), '/commercial-facilities', 2, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('worker-household-income', '労働者世帯収入', (SELECT id FROM categories WHERE category_key = 'economy'), '/worker-household-income', 1, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('household-economy', '家計', (SELECT id FROM categories WHERE category_key = 'economy'), '/household-economy', 2, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('business-scale', '企業規模', (SELECT id FROM categories WHERE category_key = 'economy'), '/business-scale', 3, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('business-activity', '企業活動', (SELECT id FROM categories WHERE category_key = 'economy'), '/business-activity', 4, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('gross-product-economic-indicators', '総生産・経済指標', (SELECT id FROM categories WHERE category_key = 'economy'), '/gross-product-economic-indicators', 5, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('consumer-price-difference-index', '消費者物価地域差指数', (SELECT id FROM categories WHERE category_key = 'economy'), '/consumer-price-difference-index', 6, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('living-environment', '生活環境', (SELECT id FROM categories WHERE category_key = 'construction'), '/living-environment', 1, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('housing-ownership', '住宅所有', (SELECT id FROM categories WHERE category_key = 'construction'), '/housing-ownership', 2, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('housing-structure', '住宅構造', (SELECT id FROM categories WHERE category_key = 'construction'), '/housing-structure', 3, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('housing-facilities', '住宅設備', (SELECT id FROM categories WHERE category_key = 'construction'), '/housing-facilities', 4, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('construction-manufacturing', '建設・製造', (SELECT id FROM categories WHERE category_key = 'construction'), '/construction-manufacturing', 5, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('welfare-facilities', '福祉施設', (SELECT id FROM categories WHERE category_key = 'construction'), '/welfare-facilities', 6, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('housing-statistics', '住宅統計', (SELECT id FROM categories WHERE category_key = 'construction'), '/housing-statistics', 7, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('water-supply-sewerage', '上水道・下水道', (SELECT id FROM categories WHERE category_key = 'energy'), '/water-supply-sewerage', 1, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('waste-management', '廃棄物処理', (SELECT id FROM categories WHERE category_key = 'energy'), '/waste-management', 2, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('industrial-water', '工業用水', (SELECT id FROM categories WHERE category_key = 'energy'), '/industrial-water', 3, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('infrastructure-energy', 'インフラ・エネルギー', (SELECT id FROM categories WHERE category_key = 'energy'), '/infrastructure-energy', 4, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('tourism-accommodation', '観光・宿泊', (SELECT id FROM categories WHERE category_key = 'tourism'), '/tourism-accommodation', 1, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('kindergarten', '幼稚園', (SELECT id FROM categories WHERE category_key = 'educationsports'), '/kindergarten', 1, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('elementary-school', '小学校', (SELECT id FROM categories WHERE category_key = 'educationsports'), '/elementary-school', 2, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('junior-high-school', '中学校', (SELECT id FROM categories WHERE category_key = 'educationsports'), '/junior-high-school', 3, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('high-school', '高等学校', (SELECT id FROM categories WHERE category_key = 'educationsports'), '/high-school', 4, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('college-university', '短大・大学', (SELECT id FROM categories WHERE category_key = 'educationsports'), '/college-university', 5, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('cultural-facilities', '文化施設', (SELECT id FROM categories WHERE category_key = 'educationsports'), '/cultural-facilities', 6, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('sports-facilities', 'スポーツ施設', (SELECT id FROM categories WHERE category_key = 'educationsports'), '/sports-facilities', 7, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('social-activities', '社会活動', (SELECT id FROM categories WHERE category_key = 'educationsports'), '/social-activities', 8, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('childcare-early-education', '保育・幼児教育', (SELECT id FROM categories WHERE category_key = 'educationsports'), '/childcare-early-education', 9, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('compulsory-education', '義務教育', (SELECT id FROM categories WHERE category_key = 'educationsports'), '/compulsory-education', 10, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('fiscal-indicators', '財政指標', (SELECT id FROM categories WHERE category_key = 'administrativefinancial'), '/fiscal-indicators', 1, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('staff-assembly-election', '職員・議会・選挙', (SELECT id FROM categories WHERE category_key = 'administrativefinancial'), '/staff-assembly-election', 2, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('tax-revenue', '税収', (SELECT id FROM categories WHERE category_key = 'administrativefinancial'), '/tax-revenue', 3, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('investment', '投資', (SELECT id FROM categories WHERE category_key = 'administrativefinancial'), '/investment', 4, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('revenue', '歳入', (SELECT id FROM categories WHERE category_key = 'administrativefinancial'), '/revenue', 5, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('expenditure', '歳出', (SELECT id FROM categories WHERE category_key = 'administrativefinancial'), '/expenditure', 6, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('fire-emergency', '消防・緊急事態', (SELECT id FROM categories WHERE category_key = 'safetyenvironment'), '/fire-emergency', 1, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('fire-insurance', '火災保険', (SELECT id FROM categories WHERE category_key = 'safetyenvironment'), '/fire-insurance', 2, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('police-crime', '警察・犯罪', (SELECT id FROM categories WHERE category_key = 'safetyenvironment'), '/police-crime', 3, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('traffic-accidents', '交通事故', (SELECT id FROM categories WHERE category_key = 'safetyenvironment'), '/traffic-accidents', 4, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pollution-environment', '公害・環境', (SELECT id FROM categories WHERE category_key = 'safetyenvironment'), '/pollution-environment', 5, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('card', '社会保障指標', (SELECT id FROM categories WHERE category_key = 'socialsecurity'), '/card', 1, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('death-statistics', '死亡統計', (SELECT id FROM categories WHERE category_key = 'socialsecurity'), '/death-statistics', 2, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('public-assistance-welfare', '生活保護・福祉', (SELECT id FROM categories WHERE category_key = 'socialsecurity'), '/public-assistance-welfare', 3, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('health-care', '健康・保健', (SELECT id FROM categories WHERE category_key = 'socialsecurity'), '/health-care', 4, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('foreign-population', '外国人人口', (SELECT id FROM categories WHERE category_key = 'international'), '/foreign-population', 1, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('foreigners', '外国人統計', (SELECT id FROM categories WHERE category_key = 'international'), '/foreigners', 2, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('roads', '道路', (SELECT id FROM categories WHERE category_key = 'infrastructure'), '/roads', 1, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
