-- コロプレス地図表示機能用初期データ
-- JSONデータを基にカテゴリとサブカテゴリの初期データを挿入
-- 作成日: 2025-09-27

-- 都道府県マスターデータ挿入
INSERT OR REPLACE INTO prefectures (code, name, region, capital) VALUES
('01', '北海道', '北海道', '札幌市'),
('02', '青森県', '東北', '青森市'),
('03', '岩手県', '東北', '盛岡市'),
('04', '宮城県', '東北', '仙台市'),
('05', '秋田県', '東北', '秋田市'),
('06', '山形県', '東北', '山形市'),
('07', '福島県', '東北', '福島市'),
('08', '茨城県', '関東', '水戸市'),
('09', '栃木県', '関東', '宇都宮市'),
('10', '群馬県', '関東', '前橋市'),
('11', '埼玉県', '関東', 'さいたま市'),
('12', '千葉県', '関東', '千葉市'),
('13', '東京都', '関東', '東京'),
('14', '神奈川県', '関東', '横浜市'),
('15', '新潟県', '中部', '新潟市'),
('16', '富山県', '中部', '富山市'),
('17', '石川県', '中部', '金沢市'),
('18', '福井県', '中部', '福井市'),
('19', '山梨県', '中部', '甲府市'),
('20', '長野県', '中部', '長野市'),
('21', '岐阜県', '中部', '岐阜市'),
('22', '静岡県', '中部', '静岡市'),
('23', '愛知県', '中部', '名古屋市'),
('24', '三重県', '近畿', '津市'),
('25', '滋賀県', '近畿', '大津市'),
('26', '京都府', '近畿', '京都市'),
('27', '大阪府', '近畿', '大阪市'),
('28', '兵庫県', '近畿', '神戸市'),
('29', '奈良県', '近畿', '奈良市'),
('30', '和歌山県', '近畿', '和歌山市'),
('31', '鳥取県', '中国', '鳥取市'),
('32', '島根県', '中国', '松江市'),
('33', '岡山県', '中国', '岡山市'),
('34', '広島県', '中国', '広島市'),
('35', '山口県', '中国', '山口市'),
('36', '徳島県', '四国', '徳島市'),
('37', '香川県', '四国', '高松市'),
('38', '愛媛県', '四国', '松山市'),
('39', '高知県', '四国', '高知市'),
('40', '福岡県', '九州', '福岡市'),
('41', '佐賀県', '九州', '佐賀市'),
('42', '長崎県', '九州', '長崎市'),
('43', '熊本県', '九州', '熊本市'),
('44', '大分県', '九州', '大分市'),
('45', '宮崎県', '九州', '宮崎市'),
('46', '鹿児島県', '九州', '鹿児島市'),
('47', '沖縄県', '九州', '那覇市');

-- メインカテゴリデータ挿入
INSERT OR REPLACE INTO choropleth_categories (id, name, description, icon, color, display_order) VALUES
('landweather', '国土・気象', '土地面積、土地利用、自然環境、気象・気候に関する統計', '🗾', 'teal', 1),
('population', '人口・世帯', '総人口、人口移動、人口構成、婚姻・家族、世帯、出生・死亡に関する統計', '👥', 'blue', 2),
('laborwage', '労働・賃金', '賃金・労働条件、労働力構造、労働争議、求職・求人、産業・職業別、雇用形態に関する統計', '💼', 'yellow', 3),
('agriculture', '農林水産業', '農業世帯、農林水産業の生産・経営に関する統計', '🌾', 'green', 4),
('miningindustry', '鉱工業', '製造業、鉱業、工業生産に関する統計', '🏭', 'gray', 5),
('commercial', '商業・サービス業', '商業・サービス産業、商業施設に関する統計', '🏪', 'purple', 6),
('economy', '企業・家計・経済', '労働者世帯収入、総生産・経済指標、消費者物価地域差指数に関する統計', '📊', 'indigo', 7),
('construction', '住宅・土地・建設', '生活環境、住宅所有、住宅構造、住宅設備、建設・製造に関する統計', '🏘️', 'orange', 8),
('energy', 'エネルギー・水', '上水道・下水道、廃棄物処理、工業用水、インフラ・エネルギーに関する統計', '⚡', 'cyan', 9),
('tourism', '運輸・観光', '観光・宿泊、交通・運輸に関する統計', '✈️', 'pink', 10),
('educationsports', '教育・文化・スポーツ', '教育・スポーツ指標、文化活動に関する統計', '🎓', 'lime', 11),
('administrativefinancial', '行財政', '財政指標、職員・議会・選挙、税収、投資、歳入、歳出に関する統計', '⚖️', 'slate', 12),
('safetyenvironment', '司法・安全・環境', '消防・緊急事態、火災保険、警察・犯罪、公害・環境に関する統計', '🛡️', 'red', 13),
('socialsecurity', '社会保障・衛生', '社会保障指標、死亡統計、医療・福祉に関する統計', '🏥', 'emerald', 14),
('international', '国際', '国際関係、貿易、在留外国人に関する統計', '🌍', 'sky', 15),
('infrastructure', '社会基盤施設', '道路、橋梁、公共施設等の社会基盤に関する統計', '🛣️', 'neutral', 16);

-- 国土・気象カテゴリのサブカテゴリ
INSERT OR REPLACE INTO choropleth_subcategories (id, category_id, name, description, unit, data_type, display_order, color_scheme) VALUES
('land-area', 'landweather', '土地面積', '都道府県別の総面積', 'km²', 'numerical', 1, 'interpolateGreens'),
('land-use', 'landweather', '土地利用', '農地、宅地、森林等の土地利用状況', '%', 'percentage', 2, 'interpolateYlOrBr'),
('natural-environment', 'landweather', '自然環境', '自然公園面積、保護地域等', 'ha', 'numerical', 3, 'interpolateGreens'),
('weather-climate', 'landweather', '気象・気候', '年間降水量、平均気温等', 'mm/℃', 'numerical', 4, 'interpolateBlues');

-- 人口・世帯カテゴリのサブカテゴリ
INSERT OR REPLACE INTO choropleth_subcategories (id, category_id, name, description, unit, data_type, stats_data_id, table_name, display_order, color_scheme) VALUES
('basic-population', 'population', '総人口', '都道府県別の総人口', '人', 'numerical', '0003448738', '人口推計', 1, 'interpolateBlues'),
('population-movement', 'population', '人口移動', '転入・転出による人口移動', '人', 'numerical', '0000010101', '住民基本台帳人口移動報告', 2, 'interpolatePurples'),
('population-composition', 'population', '人口構成', '年齢別・性別人口構成', '%', 'percentage', '0000010101', '国勢調査', 3, 'interpolateOranges'),
('marriage', 'population', '婚姻・家族', '婚姻・離婚件数、家族構成', '件', 'numerical', '0000070001', '人口動態統計', 4, 'interpolateReds'),
('households', 'population', '世帯', '世帯数、世帯人員、世帯構成', '世帯', 'numerical', '0000010101', '国勢調査', 5, 'interpolateViridis'),
('birth-death', 'population', '出生・死亡', '出生率、死亡率、自然増減', '‰', 'rate', '0000070001', '人口動態統計', 6, 'interpolateRdYlBu');

-- 労働・賃金カテゴリのサブカテゴリ
INSERT OR REPLACE INTO choropleth_subcategories (id, category_id, name, description, unit, data_type, display_order, color_scheme) VALUES
('wages-working-conditions', 'laborwage', '賃金・労働条件', '平均賃金、労働時間等', '円', 'numerical', 1, 'interpolateGreens'),
('labor-force-structure', 'laborwage', '労働力構造', '労働力人口、就業率等', '%', 'percentage', 2, 'interpolateBlues'),
('labor-disputes', 'laborwage', '労働争議', '労働争議件数、参加人員', '件', 'numerical', 3, 'interpolateReds'),
('job-seeking-placement', 'laborwage', '求職・求人', '有効求人倍率、失業率', '倍', 'rate', 4, 'interpolateOranges'),
('industry-occupation', 'laborwage', '産業・職業別', '産業別・職業別就業者数', '人', 'numerical', 5, 'interpolatePurples'),
('employment-type', 'laborwage', '雇用形態', '正規・非正規雇用の構成', '%', 'percentage', 6, 'interpolateViridis');

-- 農林水産業カテゴリのサブカテゴリ
INSERT OR REPLACE INTO choropleth_subcategories (id, category_id, name, description, unit, data_type, display_order, color_scheme) VALUES
('agricultural-household', 'agriculture', '農業世帯', '農業経営体数、農業従事者数', '戸', 'numerical', 1, 'interpolateYlGn');

-- 鉱工業カテゴリのサブカテゴリ
INSERT OR REPLACE INTO choropleth_subcategories (id, category_id, name, description, unit, data_type, stats_data_id, table_name, display_order, color_scheme) VALUES
('manufacturing', 'miningindustry', '製造業', '製造業事業所数、従業者数、出荷額', '億円', 'numerical', '0000020101', '工業統計調査', 1, 'interpolatePlasma');

-- 商業・サービス業カテゴリのサブカテゴリ
INSERT OR REPLACE INTO choropleth_subcategories (id, category_id, name, description, unit, data_type, display_order, color_scheme) VALUES
('commerce-service-industry', 'commercial', '商業・サービス産業', '卸売業・小売業の事業所数、従業者数', '事業所', 'numerical', 1, 'interpolateMagma'),
('commercial-facilities', 'commercial', '商業施設', '大型小売店舗数、売場面積', 'm²', 'numerical', 2, 'interpolateInferno');

-- 企業・家計・経済カテゴリのサブカテゴリ
INSERT OR REPLACE INTO choropleth_subcategories (id, category_id, name, description, unit, data_type, stats_data_id, table_name, display_order, color_scheme) VALUES
('worker-household-income', 'economy', '労働者世帯収入', '勤労者世帯の実収入', '円', 'numerical', '0000200001', '家計調査', 1, 'interpolateGreens'),
('gross-product-economic-indicators', 'economy', '総生産・経済指標', '県内総生産、一人当たり県民所得', '千円', 'numerical', '0000040001', '県民経済計算', 2, 'interpolateBlues'),
('consumer-price-difference-index', 'economy', '消費者物価地域差指数', '全国平均を100とした物価水準', '', 'rate', '0000800001', '小売物価統計調査', 3, 'interpolateRdYlBu');

-- 住宅・土地・建設カテゴリのサブカテゴリ
INSERT OR REPLACE INTO choropleth_subcategories (id, category_id, name, description, unit, data_type, display_order, color_scheme) VALUES
('living-environment', 'construction', '生活環境', '生活環境の充実度指標', '点', 'numerical', 1, 'interpolateViridis'),
('housing-ownership', 'construction', '住宅所有', '持ち家率、借家率', '%', 'percentage', 2, 'interpolateYlOrBr'),
('housing-structure', 'construction', '住宅構造', '木造・非木造住宅の割合', '%', 'percentage', 3, 'interpolateBrBG'),
('housing-facilities', 'construction', '住宅設備', '上下水道完備率等', '%', 'percentage', 4, 'interpolatePiYG'),
('construction-manufacturing', 'construction', '建設・製造', '建設業従事者数、建築着工戸数', '戸', 'numerical', 5, 'interpolateRdGy');

-- エネルギー・水カテゴリのサブカテゴリ
INSERT OR REPLACE INTO choropleth_subcategories (id, category_id, name, description, unit, data_type, display_order, color_scheme) VALUES
('water-supply-sewerage', 'energy', '上水道・下水道', '上水道普及率、下水道普及率', '%', 'percentage', 1, 'interpolateBlues'),
('waste-management', 'energy', '廃棄物処理', '一般廃棄物処理量、リサイクル率', 'kg/人', 'numerical', 2, 'interpolateGreens'),
('industrial-water', 'energy', '工業用水', '工業用水使用量', 'm³/日', 'numerical', 3, 'interpolateTeal'),
('infrastructure-energy', 'energy', 'インフラ・エネルギー', '電力消費量、ガス普及率', 'MWh', 'numerical', 4, 'interpolateYlOrRd');

-- 運輸・観光カテゴリのサブカテゴリ
INSERT OR REPLACE INTO choropleth_subcategories (id, category_id, name, description, unit, data_type, display_order, color_scheme) VALUES
('tourism-accommodation', 'tourism', '観光・宿泊', '観光入込客数、宿泊施設数', '千人', 'numerical', 1, 'interpolatePurples');

-- 教育・文化・スポーツカテゴリのサブカテゴリ
INSERT OR REPLACE INTO choropleth_subcategories (id, category_id, name, description, unit, data_type, stats_data_id, table_name, display_order, color_scheme) VALUES
('education-sports-indicators', 'educationsports', '教育・スポーツ指標', '大学進学率、体育施設数等', '%', 'percentage', '0000060101', '学校基本調査', 1, 'interpolateWarm');

-- 行財政カテゴリのサブカテゴリ
INSERT OR REPLACE INTO choropleth_subcategories (id, category_id, name, description, unit, data_type, display_order, color_scheme) VALUES
('fiscal-indicators', 'administrativefinancial', '財政指標', '財政力指数、実質公債費比率', '', 'rate', 1, 'interpolateRdYlBu'),
('staff-assembly-election', 'administrativefinancial', '職員・議会・選挙', '地方公務員数、議員数、投票率', '%', 'percentage', 2, 'interpolateSpectral'),
('tax-revenue', 'administrativefinancial', '税収', '地方税収入額', '億円', 'numerical', 3, 'interpolateGreens'),
('investment', 'administrativefinancial', '投資', '普通建設事業費', '億円', 'numerical', 4, 'interpolateBlues'),
('revenue', 'administrativefinancial', '歳入', '一般会計歳入総額', '億円', 'numerical', 5, 'interpolatePlasma'),
('expenditure', 'administrativefinancial', '歳出', '一般会計歳出総額', '億円', 'numerical', 6, 'interpolateViridis');

-- 司法・安全・環境カテゴリのサブカテゴリ
INSERT OR REPLACE INTO choropleth_subcategories (id, category_id, name, description, unit, data_type, display_order, color_scheme) VALUES
('fire-emergency', 'safetyenvironment', '消防・緊急事態', '消防職員数、救急出動件数', '件', 'numerical', 1, 'interpolateReds'),
('fire-insurance', 'safetyenvironment', '火災保険', '建物火災件数、損害額', '件', 'numerical', 2, 'interpolateOrRd'),
('police-crime', 'safetyenvironment', '警察・犯罪', '刑法犯認知件数、検挙率', '件', 'numerical', 3, 'interpolateYlOrRd'),
('pollution-environment', 'safetyenvironment', '公害・環境', '大気汚染、水質汚濁の状況', 'ppm', 'numerical', 4, 'interpolateRdPu');

-- 社会保障・衛生カテゴリのサブカテゴリ
INSERT OR REPLACE INTO choropleth_subcategories (id, category_id, name, description, unit, data_type, stats_data_id, table_name, display_order, color_scheme) VALUES
('social-security-indicators', 'socialsecurity', '社会保障指標', '医師数、病院数、福祉施設数', '人/10万人', 'rate', '0000050102', '医師・歯科医師・薬剤師統計', 1, 'interpolateTeal'),
('death-statistics', 'socialsecurity', '死亡統計', '主要死因別死亡率', '人/10万人', 'rate', '0000070001', '人口動態統計', 2, 'interpolateGreys');

-- 利用可能年度の更新（最新5年分）
UPDATE choropleth_subcategories
SET available_years = '["2024", "2023", "2022", "2021", "2020"]'
WHERE available_years IS NULL;