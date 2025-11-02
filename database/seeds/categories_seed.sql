-- カテゴリとサブカテゴリのseedデータ
-- 生成日: 2025-01-30
-- データソース: src/config/categories.json
-- カテゴリ数: 16

-- ========================================
-- カテゴリの作成
-- ========================================
INSERT OR REPLACE INTO categories (
  category_key, category_name, icon, display_order, created_at, updated_at
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
  subcategory_key, subcategory_name, category_key, display_order, created_at, updated_at
) VALUES
  ('land-area', '土地面積', 'landweather', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('land-use', '土地利用', 'landweather', 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('natural-environment', '自然環境', 'landweather', 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('weather-climate', '気象・気候', 'landweather', 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('basic-population', '総人口', 'population', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('population-movement', '人口移動', 'population', 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('population-composition', '人口構成', 'population', 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('marriage', '婚姻・家族', 'population', 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('households', '世帯', 'population', 5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('birth-death', '出生・死亡', 'population', 6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('wages-working-conditions', '賃金・労働条件', 'laborwage', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('labor-force-structure', '労働力構造', 'laborwage', 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('industrial-structure', '産業構造', 'laborwage', 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('commuting-employment', '通勤・就職', 'laborwage', 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('labor-disputes', '労働争議', 'laborwage', 5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('job-seeking-placement', '求職・求人', 'laborwage', 6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('industry-occupation', '産業・職業別', 'laborwage', 7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('employment-type', '雇用形態', 'laborwage', 8, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('agricultural-household', '農業世帯', 'agriculture', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('manufacturing', '製造業', 'miningindustry', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('commerce-service-industry', '商業・サービス産業', 'commercial', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('commercial-facilities', '商業施設', 'commercial', 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('worker-household-income', '労働者世帯収入', 'economy', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('household-economy', '家計', 'economy', 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('business-scale', '企業規模', 'economy', 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('business-activity', '企業活動', 'economy', 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('gross-product-economic-indicators', '総生産・経済指標', 'economy', 5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('consumer-price-difference-index', '消費者物価地域差指数', 'economy', 6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('living-environment', '生活環境', 'construction', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('housing-ownership', '住宅所有', 'construction', 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('housing-structure', '住宅構造', 'construction', 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('housing-facilities', '住宅設備', 'construction', 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('construction-manufacturing', '建設・製造', 'construction', 5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('welfare-facilities', '福祉施設', 'construction', 6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('housing-statistics', '住宅統計', 'construction', 7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('water-supply-sewerage', '上水道・下水道', 'energy', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('waste-management', '廃棄物処理', 'energy', 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('industrial-water', '工業用水', 'energy', 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('infrastructure-energy', 'インフラ・エネルギー', 'energy', 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('tourism-accommodation', '観光・宿泊', 'tourism', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('kindergarten', '幼稚園', 'educationsports', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('elementary-school', '小学校', 'educationsports', 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('junior-high-school', '中学校', 'educationsports', 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('high-school', '高等学校', 'educationsports', 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('college-university', '短大・大学', 'educationsports', 5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('cultural-facilities', '文化施設', 'educationsports', 6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('sports-facilities', 'スポーツ施設', 'educationsports', 7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('social-activities', '社会活動', 'educationsports', 8, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('childcare-early-education', '保育・幼児教育', 'educationsports', 9, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('compulsory-education', '義務教育', 'educationsports', 10, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('fiscal-indicators', '財政指標', 'administrativefinancial', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('staff-assembly-election', '職員・議会・選挙', 'administrativefinancial', 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('tax-revenue', '税収', 'administrativefinancial', 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('investment', '投資', 'administrativefinancial', 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('revenue', '歳入', 'administrativefinancial', 5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('expenditure', '歳出', 'administrativefinancial', 6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('fire-emergency', '消防・緊急事態', 'safetyenvironment', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('fire-insurance', '火災保険', 'safetyenvironment', 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('police-crime', '警察・犯罪', 'safetyenvironment', 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('traffic-accidents', '交通事故', 'safetyenvironment', 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pollution-environment', '公害・環境', 'safetyenvironment', 5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('card', '社会保障指標', 'socialsecurity', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('death-statistics', '死亡統計', 'socialsecurity', 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('public-assistance-welfare', '生活保護・福祉', 'socialsecurity', 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('health-care', '健康・保健', 'socialsecurity', 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('foreign-population', '外国人人口', 'international', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('foreigners', '外国人統計', 'international', 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('roads', '道路', 'infrastructure', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('uncategorized', '未分類', 'population', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
