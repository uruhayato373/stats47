/**
 * SSDS の「資料源」(原典統計名) → survey id の正規化辞書。
 *
 * `cdcat01-sources.generated.json` が持つ生の原典名を、
 * `packages/ranking/src/data/surveys.json` の survey id に正規化する。
 *
 * 方針:
 *   - 既存の survey マスタに対応する原典は、その id にマップする (KNOWN_SOURCE_TO_SURVEY)。
 *   - マスタに無いが頻度の高い原典は PROPOSED_NEW_SURVEYS で id を宣言し、
 *     `sync-survey-master.ts` で surveys.json へ実体を追加する。
 *   - cdCat01 が Excel に資料源を持たない (財政比率・銀行預金・健康寿命 等の派生項目) ものは
 *     CDCAT01_SOURCE_OVERRIDE で原典名を手当てする。
 *   - 辞書にも override にも無い原典名は、生成器が決定的に slug 化して `ssds-src:<原典名>` を
 *     割り当てる (未マッピングでも全 metric が必ず原典を 1 つ以上持つことを保証)。
 *
 * 出典 Excel: https://www.stat.go.jp/data/ssds/2.html (アクセス日 2026-06-02)
 * 追加原典の所管・公式 URL は各府省サイトで確認 (最終アクセス日 2026-08-28)。
 */

/** 既存 survey マスタ (surveys.json) に存在する id への対応 */
export const KNOWN_SOURCE_TO_SURVEY: Record<string, string> = {
  国勢調査報告: 'census',
  人口推計: 'population-estimates',
  人口動態統計: 'vital-statistics',
  学校基本調査報告書: 'school-basic-survey',
  社会生活基本調査報告: 'social-life-basic-survey',
  '住宅・土地統計調査報告': 'housing-land-survey',
  医療施設調査: 'medical-facility-survey',
  '医療施設調査・病院報告': 'medical-facility-survey',
  病院報告: 'hospital-report',
  県民経済計算年報: 'prefectural-accounts',
  地方財政統計年報: 'local-finance',
  // 決算カードの原典名。同ファイル内のコメントが「地方財政状況調査 (= 地方財政統計年報)」と
  // 同一視しているとおり同じ調査で、表記だけが違う。ブログの市町村財政記事が
  // sourceName に正式名を書くため、こちらの表記も引けるようにする (2026-08-31)。
  地方財政状況調査: 'local-finance',
  // 国土数値情報 (国土交通省)。ダム・空港・鉄道駅などを都道府県別に集計した指標の原典。
  国土数値情報: 'mlit-ksj',
  // 林野庁の統計総覧。SSDS の C3114 (林道延長) 等の原典で、合成 id のままだと配信から外れる。
  '森林・林業統計要覧': 'forestry-statistics-handbook',
  社会教育調査報告書: 'social-education-survey',
  賃金構造基本統計調査報告: 'wage-structure-survey',
  就業構造基本調査報告: 'employment-structure-survey',
  衛生行政報告例: 'health-admin-report',
  患者調査: 'patient-survey',
  家計調査: 'household-survey',
  全国家計構造調査: 'national-household-survey',
  全国消費実態調査報告: 'national-household-survey', // 全国家計構造調査の前身
  犯罪統計書: 'police-statistics',
  交通事故統計年報: 'traffic-accident-statistics',
  道路の交通に関する統計: 'traffic-accident-statistics',
  宿泊旅行統計調査報告: 'accommodation-survey',
  '医師・歯科医師・薬剤師統計': 'physician-survey',
  '医師・歯科医師・薬剤師調査': 'physician-survey',
  工業統計調査: 'industrial-statistics',
  商業統計調査: 'commercial-statistics',
  商業統計表: 'commercial-statistics',
  労働災害動向調査報告: 'workplace-accident-survey',
  地域別最低賃金の全国一覧: 'minimum-wage',
  市町村税課税状況等の調: 'local-tax',
  消費者物価指数: 'cpi-annual',
  '漁業・養殖業生産統計': 'fishery-aquaculture-production',
  気象庁ウェブサイト: 'weather-statistics',
  作物統計: 'crop-statistics',
  野菜生産出荷統計: 'crop-statistics',
  建築着工統計調査報告: 'housing-starts-statistics',
  建築着工統計調査: 'housing-starts-statistics',
  気象庁年報: 'weather-statistics',
  耕地及び作付面積統計: 'crop-statistics',
  港湾調査: 'port-statistics',
  小売物価統計調査年報: 'retail-price-survey',
  消費者物価指数月報: 'cpi-annual',
  社会福祉行政業務報告: 'welfare-admin-report',
  都市公園整備現況: 'urban-park-survey',
  登録外国人統計調査: 'foreign-residents-statistics',
  '日本郵政公社統計データ（簡易保険編）': 'japan-post-statistics',
  道路交通センサス: 'road-statistics',
  '全国道路・街路交通情勢調査': 'road-statistics',
  '新規学卒者（高校・中学）の職業紹介状況': 'job-placement-statistics',
  障害者の職業紹介状況等: 'job-placement-statistics',
  '児童生徒の問題行動・不登校等生徒指導上の諸課題に関する調査':
    'student-guidance-issues-survey',
  都道府県別生命表: 'life-tables',
  '地域保健･健康増進事業報告': 'regional-health-promotion-report',
  消防白書: 'fire-annual-report',
  '貨物自動車運送事業者数（運輸局・支局別）': 'truck-operator-statistics',
  地方公共団体の議会の議員及び長の所属党派別人員調等:
    'local-election-statistics',
  選挙人名簿及び在外選挙人名簿登録者数: 'voter-registration-statistics',
  '衆議院議員総選挙　最高裁判所裁判官国民審査結果調':
    'national-election-results',
  参議院議員通常選挙結果調: 'national-election-results',
  '住民基本台帳に基づく人口、人口動態及び世帯数調査（住民基本台帳人口要覧）':
    'resident-registry-population-survey',
};

/**
 * survey マスタ未登録で Phase 2 で正式追加する原典。
 * 生成器はこの id を auto-slug より優先して使う。
 * `sync-survey-master.ts` がこの定義を surveys.json に同期する。
 */
export const PROPOSED_NEW_SURVEYS: Record<
  string,
  { id: string; name: string; organization?: string; url?: string }
> = {
  // --- Phase 1 で宣言済 ---
  社会福祉施設等調査: {
    id: 'social-welfare-facility-survey',
    name: '社会福祉施設等調査',
    organization: '厚生労働省',
  },
  都道府県決算状況調: {
    id: 'prefectural-settlement-survey',
    name: '都道府県決算状況調',
    organization: '総務省',
  },
  市町村別決算状況調: {
    id: 'municipal-settlement-survey',
    name: '市町村別決算状況調',
    organization: '総務省',
  },
  '経済センサス-活動調査': {
    id: 'economic-census-activity',
    name: '経済センサス-活動調査',
    organization: '総務省・経済産業省',
  },
  '経済センサス-基礎調査': {
    id: 'economic-census-basic',
    name: '経済センサス-基礎調査',
    organization: '総務省',
  },
  全国都道府県市区町村別面積調: {
    id: 'area-survey',
    name: '全国都道府県市区町村別面積調',
    organization: '国土地理院',
  },
  '介護サービス施設・事業所調査': {
    id: 'care-service-facility-survey',
    name: '介護サービス施設・事業所調査',
    organization: '厚生労働省',
  },
  被保護者調査: {
    id: 'public-assistance-survey',
    name: '被保護者調査',
    organization: '厚生労働省',
  },
  消費者物価指数年報: {
    id: 'cpi-annual',
    name: '消費者物価指数年報',
    organization: '総務省統計局',
  },
  '小売物価統計調査（構造編）': {
    id: 'retail-price-survey',
    name: '小売物価統計調査（構造編）',
    organization: '総務省統計局',
    url: 'https://www.stat.go.jp/data/kouri/kouzou/gaiyou.html',
  },
  学校保健統計調査報告書: {
    id: 'school-health-survey',
    name: '学校保健統計調査報告書',
    organization: '文部科学省',
  },
  福祉行政報告例: {
    id: 'welfare-admin-report',
    name: '福祉行政報告例',
    organization: '厚生労働省',
  },
  '事業所・企業統計調査報告': {
    id: 'establishment-enterprise-census',
    name: '事業所・企業統計調査報告',
    organization: '総務省',
  },
  農林業センサス: {
    id: 'agriculture-forestry-census',
    name: '農林業センサス',
    organization: '農林水産省',
  },

  // --- Phase 2 で auto-slug から昇格 (高頻度) ---
  '道路施設現況調査（道路統計年報）': {
    id: 'road-statistics',
    name: '道路統計年報',
    organization: '国土交通省',
  },
  行政投資実績: {
    id: 'administrative-investment-report',
    name: '行政投資実績',
    organization: '総務省',
  },
  '漁業・養殖業生産統計年報': {
    id: 'fishery-aquaculture-production',
    name: '漁業・養殖業生産統計年報',
    organization: '農林水産省',
  },
  労働市場年報: {
    id: 'labor-market-annual',
    name: '労働市場年報',
    organization: '厚生労働省',
  },
  過去の気象データ: {
    id: 'weather-statistics',
    name: '気象統計',
    organization: '気象庁',
  },
  住宅着工統計: {
    id: 'housing-starts-statistics',
    name: '住宅着工統計',
    organization: '国土交通省',
  },
  一般職業紹介状況: {
    id: 'job-placement-statistics',
    name: '一般職業紹介状況',
    organization: '厚生労働省',
  },
  都市計画現況調査: {
    id: 'city-planning-survey',
    name: '都市計画現況調査',
    organization: '国土交通省',
  },
  一般廃棄物処理事業実態調査: {
    id: 'waste-management-survey',
    name: '一般廃棄物処理事業実態調査',
    organization: '環境省',
  },
  在留外国人統計: {
    id: 'foreign-residents-statistics',
    name: '在留外国人統計',
    organization: '法務省',
  },
  日本の将来推計人口: {
    id: 'population-projection',
    name: '日本の将来推計人口',
    organization: '国立社会保障・人口問題研究所',
  },
  地方公共団体定員管理調査: {
    id: 'local-gov-staffing-survey',
    name: '地方公共団体定員管理調査',
    organization: '総務省',
  },
  損害保険料率算出機構統計集: {
    id: 'insurance-rate-org-statistics',
    name: '損害保険料率算出機構統計集',
    organization: '損害保険料率算出機構',
  },
  都道府県地価調査: {
    id: 'prefectural-land-price-survey',
    name: '都道府県地価調査',
    organization: '国土交通省',
  },
  水道統計: {
    id: 'waterworks-statistics',
    name: '水道統計',
    organization: '厚生労働省',
  },
  農業経営統計調査報告: {
    id: 'agriculture-management-survey',
    name: '農業経営統計調査報告',
    organization: '農林水産省',
  },
  '都市公園データベース・都市公園等整備現況調査': {
    id: 'urban-park-survey',
    name: '都市公園等整備現況調査',
    organization: '国土交通省',
  },
  下水道統計: {
    id: 'sewerage-statistics',
    name: '下水道統計',
    organization: '日本下水道協会',
  },
  地方教育費調査報告書: {
    id: 'local-education-expense-survey',
    name: '地方教育費調査報告書',
    organization: '文部科学省',
  },
  火災年報: {
    id: 'fire-annual-report',
    name: '火災年報',
    organization: '消防庁',
  },
  建設工事施工統計調査報告: {
    id: 'construction-work-statistics',
    name: '建設工事施工統計調査報告',
    organization: '国土交通省',
  },
  旅客地域流動調査: {
    id: 'passenger-regional-flow-survey',
    name: '旅客地域流動調査',
    organization: '国土交通省',
  },
  自然公園の面積: {
    id: 'natural-park-area',
    name: '自然公園の面積',
    organization: '環境省',
  },

  // --- 2026-08 調査 taxonomy 横断監査で正式化した原典 ---
  貨物地域流動調査: {
    id: 'freight-regional-flow-survey',
    name: '貨物地域流動調査',
    organization: '国土交通省',
    url: 'https://www.mlit.go.jp/statistics/details/sample03_2_00035.html',
  },
  '厚生年金保険・国民年金事業年報': {
    id: 'pension-insurance-annual-report',
    name: '厚生年金保険・国民年金事業年報',
    organization: '厚生労働省',
    url: 'https://www.mhlw.go.jp/stf/seisakunitsuite/bunya/0000106808_1.html',
  },
  国民医療費: {
    id: 'national-medical-expenditure',
    name: '国民医療費',
    organization: '厚生労働省',
    url: 'https://www.mhlw.go.jp/toukei/list/37-21a.html',
  },
  後期高齢者医療事業年報: {
    id: 'late-elderly-medical-annual-report',
    name: '後期高齢者医療事業年報',
    organization: '厚生労働省',
    url: 'https://www.mhlw.go.jp/stf/seisakunitsuite/bunya/iryouhoken/database/seido/kouki_houkoku.html',
  },
  '港湾調査（港湾統計年報）': {
    id: 'port-statistics',
    name: '港湾調査（港湾統計年報）',
    organization: '国土交通省',
    url: 'https://www.mlit.go.jp/k-toukei/kouwan.html',
  },
  住民基本台帳人口移動報告年報: {
    id: 'resident-registry-migration-report',
    name: '住民基本台帳人口移動報告',
    organization: '総務省統計局',
    url: 'https://www.stat.go.jp/data/idou/index.html',
  },
  電気通信役務契約等状況報告: {
    id: 'telecommunications-service-contract-report',
    name: '電気通信役務契約等状況報告',
    organization: '総務省・NTT東日本・NTT西日本',
    url: 'https://www.e-stat.go.jp/koumoku/koumoku_teigi/H',
  },

  // --- override 解決に必要な原典 ---
  日本銀行統計: {
    id: 'boj-statistics',
    name: '日本銀行統計',
    organization: '日本銀行',
  },
  国民生活基礎調査: {
    id: 'comprehensive-living-conditions-survey',
    name: '国民生活基礎調査',
    organization: '厚生労働省',
  },
  日本郵政統計: {
    id: 'japan-post-statistics',
    name: '日本郵政統計',
    organization: '日本郵政',
  },

  // --- 非SSDS 一次統計 (displayname-to-survey.ts と対) ---
  水害統計調査: {
    id: 'flood-statistics',
    name: '水害統計調査',
    organization: '国土交通省',
  },
  建設工事受注動態統計調査: {
    id: 'construction-orders-statistics',
    name: '建設工事受注動態統計調査',
    organization: '国土交通省',
  },
  地方公務員給与実態調査: {
    id: 'local-public-employee-salary',
    name: '地方公務員給与実態調査',
    organization: '総務省',
    url: 'https://www.e-stat.go.jp/stat-search/files?layout=dataset&toukei=00200212',
  },

  // --- 2026-09-07 survey taxonomy 100% 化で正式化した現行原典 ---
  漁業センサス: {
    id: 'fishery-census',
    name: '漁業センサス',
    organization: '農林水産省',
  },
  雇用動向調査: {
    id: 'employment-trends-survey',
    name: '雇用動向調査',
    organization: '厚生労働省',
  },
  '住民基本台帳人口・世帯数調査': {
    id: 'resident-registry-population-survey',
    name: '住民基本台帳に基づく人口、人口動態及び世帯数調査',
    organization: '総務省',
  },
  '地域保健・健康増進事業報告': {
    id: 'regional-health-promotion-report',
    name: '地域保健・健康増進事業報告',
    organization: '厚生労働省',
  },
  騒音規制法施行状況調査: {
    id: 'noise-control-law-status-survey',
    name: '騒音規制法施行状況調査',
    organization: '環境省',
    url: 'https://www.e-stat.go.jp/stat-search/files?page=1&toukei=00650302&tstat=000001115436',
  },
  '全国学力・学習状況調査': {
    id: 'academic-achievement-survey',
    name: '全国学力・学習状況調査',
    organization: '文部科学省・国立教育政策研究所',
    url: 'https://www.nier.go.jp/25chousakekkahoukoku/factsheet/prefecture_city.html',
  },
  '加盟校・加盟生徒数調査': {
    id: 'junior-high-athletics-membership-survey',
    name: '加盟校・加盟生徒数調査',
    organization: '日本中学校体育連盟',
    url: 'https://nippon-chutairen.or.jp/data/result/',
  },
  都道府県別年齢調整死亡率: {
    id: 'age-adjusted-mortality-statistics',
    name: '都道府県別年齢調整死亡率',
    organization: '厚生労働省',
  },
  完全生命表: { id: 'life-tables', name: '生命表', organization: '厚生労働省' },
  農地の移動と転用: {
    id: 'farmland-transfer-conversion-report',
    name: '農地の移動と転用',
    organization: '農林水産省',
  },
  木材需給報告書: {
    id: 'wood-supply-demand-report',
    name: '木材需給報告書',
    organization: '農林水産省',
  },
  特用林産基礎資料: {
    id: 'special-forest-products-statistics',
    name: '特用林産基礎資料',
    organization: '林野庁',
  },
  '6次産業化総合調査': {
    id: 'sixth-industry-survey',
    name: '6次産業化総合調査',
    organization: '農林水産省',
  },
  交通関連統計資料集: {
    id: 'motor-vehicle-transport-statistics',
    name: '交通関連統計資料集',
    organization: '国土交通省',
  },
  ガス事業年報: {
    id: 'gas-business-statistics',
    name: 'ガス事業年報',
    organization: '資源エネルギー庁',
  },
  電気事業便覧: {
    id: 'electricity-business-statistics',
    name: '電気事業便覧',
    organization: '資源エネルギー庁',
  },
  都道府県別石油製品販売総括: {
    id: 'petroleum-sales-statistics',
    name: '都道府県別石油製品販売総括',
    organization: '経済産業省',
  },
  都道府県別エネルギー消費統計: {
    id: 'prefectural-energy-consumption-statistics',
    name: '都道府県別エネルギー消費統計',
    organization: '資源エネルギー庁',
  },
  日本における都道府県別風力発電導入量: {
    id: 'wind-power-deployment-statistics',
    name: '都道府県別風力発電導入量',
    organization: '国立研究開発法人新エネルギー・産業技術総合開発機構',
  },
  '固定資産の価格等の概要調書（土地）': {
    id: 'fixed-asset-tax-land-statistics',
    name: '固定資産の価格等の概要調書（土地）',
    organization: '総務省',
  },
  公庫融資利用者調査報告: {
    id: 'housing-finance-user-survey',
    name: '公庫融資利用者調査報告',
    organization: '住宅金融支援機構',
  },
  雇用保険事業年報: {
    id: 'employment-insurance-annual-report',
    name: '雇用保険事業年報',
    organization: '厚生労働省',
  },
  労働者災害補償保険事業年報: {
    id: 'workers-compensation-annual-report',
    name: '労働者災害補償保険事業年報',
    organization: '厚生労働省',
  },
  国民健康保険事業年報: {
    id: 'national-health-insurance-annual-report',
    name: '国民健康保険事業年報',
    organization: '厚生労働省',
  },
  健康保険事業年報: {
    id: 'health-insurance-annual-report',
    name: '健康保険事業年報',
    organization: '厚生労働省',
  },
  健康保険組合事業年報: {
    id: 'health-insurance-society-annual-report',
    name: '健康保険組合事業年報',
    organization: '厚生労働省',
  },
  大気汚染防止法施行状況: {
    id: 'air-pollution-control-law-status',
    name: '大気汚染防止法施行状況',
    organization: '環境省',
  },
  水質汚濁防止法等の施行状況: {
    id: 'water-pollution-control-law-status',
    name: '水質汚濁防止法等の施行状況',
    organization: '環境省',
  },
  生命保険事業概況: {
    id: 'life-insurance-business-statistics',
    name: '生命保険事業概況',
    organization: '生命保険協会',
  },
  人口問題研究: {
    id: 'population-research',
    name: '人口問題研究',
    organization: '国立社会保障・人口問題研究所',
  },
  自然環境保全地域各種データ: {
    id: 'natural-conservation-area-data',
    name: '自然環境保全地域各種データ',
    organization: '環境省',
  },
  国税庁統計年報書: {
    id: 'nta-annual-statistics',
    name: '国税庁統計年報書',
    organization: '国税庁',
  },
  汚水処理人口普及状況: {
    id: 'wastewater-treatment-coverage-report',
    name: '汚水処理人口普及状況',
    organization: '環境省・農林水産省・国土交通省',
  },
  都道府県別食糧自給率: {
    id: 'prefectural-food-self-sufficiency',
    name: '都道府県別食料自給率',
    organization: '農林水産省',
  },
  '地方公共団体議員・長所属党派別人員調': {
    id: 'local-election-statistics',
    name: '地方公共団体の議会の議員及び長の所属党派別人員調等',
    organization: '総務省',
  },
  選挙人名簿登録者数: {
    id: 'voter-registration-statistics',
    name: '選挙人名簿及び在外選挙人名簿登録者数',
    organization: '総務省',
  },
  国政選挙結果調: {
    id: 'national-election-results',
    name: '国政選挙結果調',
    organization: '総務省',
  },
  地方選挙結果調: {
    id: 'local-election-results',
    name: '地方選挙結果調',
    organization: '総務省',
  },
  介護保険事業状況報告年報: {
    id: 'long-term-care-insurance-annual-report',
    name: '介護保険事業状況報告年報',
    organization: '厚生労働省',
  },
  貨物自動車運送事業者数: {
    id: 'truck-operator-statistics',
    name: '貨物自動車運送事業者数',
    organization: '国土交通省',
  },
  自動車保有車両数: {
    id: 'vehicle-registration-statistics',
    name: '自動車保有車両数',
    organization: '国土交通省',
  },

  // --- 日本国勢図会の一次資料照合で正式化した現行原典 ---
  経済構造実態調査: {
    id: 'economic-structure-survey',
    name: '経済構造実態調査',
    organization: '総務省・経済産業省',
    url: 'https://www.stat.go.jp/data/kkj/index.htm',
  },
  生産農業所得統計: {
    id: 'agricultural-income-statistics',
    name: '生産農業所得統計',
    organization: '農林水産省',
    url: 'https://www.maff.go.jp/j/tokei/kouhyou/nougyou_sansyutu/index.html',
  },
  '児童生徒の問題行動・不登校等生徒指導上の諸課題に関する調査結果': {
    id: 'student-guidance-issues-survey',
    name: '児童生徒の問題行動・不登校等生徒指導上の諸課題に関する調査',
    organization: '文部科学省',
    url: 'https://www.mext.go.jp/b_menu/toukei/chousa01/shidou/gaiyou/chousa/1267368.htm',
  },
};

/** 2026-09-07 の ranking/theme/blog 横断 inventory で参照 0 を確認した master 行。 */
export const RETIRED_SURVEY_IDS = [
  'balance-of-payments',
  'comprehensive-energy-statistics',
  'corporate-enterprise-statistics',
  'current-production-statistics',
  'electric-power-statistics',
  'food-balance-sheet',
  'labour-force-survey',
  'monthly-labour-survey',
  'national-accounts',
  'national-health-nutrition-survey',
  'overseas-business-activities-survey',
  'railway-transport-survey',
  'retail-price-dynamics-survey',
  'science-technology-research-survey',
  'social-security-cost-statistics',
  'trade-statistics',
] as const;

/**
 * cdCat01 が Excel に資料源を持たない派生項目への原典手当て。
 * 値は原典名 (KNOWN / PROPOSED で解決される名称)。Phase 2 で 22 件の未解決を解消。
 */
export const CDCAT01_SOURCE_OVERRIDE: Record<string, string[]> = {
  // 地方財政状況調査 (= 地方財政統計年報) 由来の財政指標
  D2201: ['地方財政統計年報'], // 財政力指数
  D2202: ['地方財政統計年報'], // 実質収支比率
  D2203: ['地方財政統計年報'], // 経常収支比率
  D2211: ['地方財政統計年報'], // 実質公債費比率
  '#D02213': ['地方財政統計年報'], // 標準財政規模
  '#D02214': ['地方財政統計年報'], // 実質赤字比率
  '#D02215': ['地方財政統計年報'], // 連結実質赤字比率
  D2212: ['地方財政統計年報'], // 将来負担比率
  // 銀行・郵便貯金 (日本銀行統計 / 日本郵政)
  C360111: ['日本銀行統計'], // 国内銀行預金残高
  C360211: ['日本銀行統計'], // 個人預金
  C360311: ['日本銀行統計'], // 銀行貸出残高
  C360120: ['日本郵政統計'], // 郵便貯金残高
  '#H06309': ['日本郵政統計'], // 郵便物取扱数
  H7501: ['日本郵政統計'], // 郵便局数
  // 人口・住宅・教育・福祉・健康
  '#A03506': ['国勢調査報告'], // 65歳以上人口割合
  '#H02103': ['住宅・土地統計調査報告'], // 1住宅当たり延べ面積
  '#E0910101': ['学校基本調査報告書'], // 幼稚園就園率
  '#E0910102': ['社会福祉施設等調査'], // 保育所利用率
  '#J02206': ['社会福祉施設等調査'], // 介護老人福祉施設
  I1601: ['国民生活基礎調査'], // 健康寿命(男)
  I1602: ['国民生活基礎調査'], // 健康寿命(女)
  // 「事業年報」だけでは制度を識別できないため、指標コードで原典を固定する。
  '#I1520401': ['健康保険事業年報'],
  '#I1520402': ['健康保険事業年報'],
  '#I1520301': ['健康保険組合事業年報'],
  '#I1520302': ['健康保険組合事業年報'],
  '#I1520501': ['健康保険組合事業年報'],
  '#I1520502': ['健康保険組合事業年報'],
  J520111: ['厚生年金保険・国民年金事業年報'],
  J520112: ['厚生年金保険・国民年金事業年報'],
};

/** 原典名 → survey id を解決 (KNOWN > PROPOSED > null=auto-slug)。 */
export function resolveSurveyId(sourceName: string): string | null {
  return (
    KNOWN_SOURCE_TO_SURVEY[sourceName] ??
    PROPOSED_NEW_SURVEYS[sourceName]?.id ??
    null
  );
}
