/**
 * 非 SSDS (一次統計) の estat metric の displayName → survey id 正規化辞書。
 *
 * SSDS metric は cdCat01 → ssds-provenance で解決するが、一次統計 (国勢調査・家計調査 等) は
 * `source.displayName` がそのまま調査名になっているため、ここで survey id に正規化する。
 *
 * tail (displayName が調査名でなく指標ラベルになっている metric) はこの辞書に載らず、
 * resolver では未解決 (空配列) として扱う。これらは metric config 側の出典ラベルの
 * 品質問題であり、auto-slug で偽の survey を作らず、coverage report で可視化する方針。
 */

/** 非SSDS estat の displayName → survey id */
export const DISPLAYNAME_TO_SURVEY: Record<string, string> = {
  社会生活基本調査: 'social-life-basic-survey',
  賃金構造基本統計調査: 'wage-structure-survey',
  人口動態統計: 'vital-statistics',
  人口動態調査: 'vital-statistics',
  社会教育調査: 'social-education-survey',
  衛生行政報告例: 'health-admin-report',
  '住宅・土地統計調査': 'housing-land-survey',
  就業構造基本調査: 'employment-structure-survey',
  個人企業経済調査: 'sole-proprietor-survey',
  商業動態統計調査: 'commercial-dynamics-survey',
  作物統計調査: 'crop-statistics',
  生産農業所得統計: 'agricultural-income-statistics',
  水質汚濁物質排出量総合調査: 'water-pollution-survey',
  患者調査: 'patient-survey',
  病院報告: 'hospital-report',
  労働災害動向調査: 'workplace-accident-survey',
  国勢調査: 'census',
  人口推計: 'population-estimates',
  社会福祉施設等調査: 'social-welfare-facility-survey',
  // 既存 survey マスタに無いが頻度のある一次統計
  海面漁業生産統計調査: 'fishery-aquaculture-production',
  水害統計調査: 'flood-statistics',
  建設工事受注動態統計調査: 'construction-orders-statistics',
  地方公務員給与実態調査: 'local-public-employee-salary',
  畜産統計調査: 'livestock-statistics',
  工場立地動向調査: 'factory-location-survey',
  漁業センサス: 'fishery-census',
  雇用動向調査: 'employment-trends-survey',
  '地域保健・健康増進事業報告': 'regional-health-promotion-report',
  騒音規制法施行状況調査: 'noise-control-law-status-survey',
  '国立教育政策研究所「全国学力・学習状況調査」': 'academic-achievement-survey',
  '(公財)日本中学校体育連盟': 'junior-high-athletics-membership-survey',
  '県民経済計算年報（内閣府）': 'prefectural-accounts',
  // IPSS 令和5年推計の正式な地域別人口推計名。全国推計・GISメッシュとの推測同一視はしない。
  // https://www.ipss.go.jp/pp-shicyoson/j/shicyoson23/t-page.asp (確認: 2026-09-06)
  '日本の地域別将来推計人口（令和5年推計）': 'population-projection',
};

/**
 * registry に同じ統計表の metric が無く、displayName consensus を作れない一次統計。
 * e-Stat の統計表 ID は恒久 ID なので、ThemeCatalog 等の直接参照も同じ resolver で解決する。
 */
export const STATS_DATA_ID_TO_SURVEY_OVERRIDE: Record<
  string,
  { id: string; name: string }
> = {
  // 2026-09-07 に e-Stat 公式 getMetaInfo で統計名を照合。
  // 直接表: https://www.e-stat.go.jp/stat-search/database?layout=dataset&statdisp_id=<ID>
  '0003130688': { id: 'port-statistics', name: '港湾調査（港湾統計年報）' },
  '0003130737': { id: 'port-statistics', name: '港湾調査（港湾統計年報）' },
  '0003130773': { id: 'port-statistics', name: '港湾調査（港湾統計年報）' },
  '0003130796': { id: 'port-statistics', name: '港湾調査（港湾統計年報）' },
  '0003262278': { id: 'fishery-census', name: '漁業センサス' },
  '0003262280': { id: 'fishery-census', name: '漁業センサス' },
  '0003262281': { id: 'fishery-census', name: '漁業センサス' },
  '0003262282': { id: 'fishery-census', name: '漁業センサス' },
  '0003262285': { id: 'fishery-census', name: '漁業センサス' },
  '0003262287': { id: 'fishery-census', name: '漁業センサス' },
  '0003262291': { id: 'fishery-census', name: '漁業センサス' },
  '0003262295': { id: 'fishery-census', name: '漁業センサス' },
  '0003281586': {
    id: 'traffic-accident-statistics',
    name: '道路の交通に関する統計',
  },
  '0003355281': { id: 'housing-land-survey', name: '住宅・土地統計調査' },
  '0003355488': { id: 'housing-land-survey', name: '住宅・土地統計調査' },
  '0003355518': { id: 'housing-land-survey', name: '住宅・土地統計調査' },
  '0003376330': { id: 'employment-trends-survey', name: '雇用動向調査' },
  '0003395254': { id: 'commercial-dynamics-survey', name: '商業動態統計調査' },
  '0003411431': { id: 'factory-location-survey', name: '工場立地動向調査' },
  '0003411445': { id: 'factory-location-survey', name: '工場立地動向調査' },
  '0003411708': { id: 'vital-statistics', name: '人口動態調査' },
  '0003412078': { id: 'vital-statistics', name: '人口動態調査' },
  '0003423836': { id: 'crop-statistics', name: '作物統計調査' },
  '0003455918': { id: 'social-life-basic-survey', name: '社会生活基本調査' },
  '0003455926': { id: 'social-life-basic-survey', name: '社会生活基本調査' },
  '0003457306': { id: 'social-life-basic-survey', name: '社会生活基本調査' },
  '0003457311': { id: 'social-life-basic-survey', name: '社会生活基本調査' },
  '0003457319': { id: 'social-life-basic-survey', name: '社会生活基本調査' },
  '0004002555': { id: 'patient-survey', name: '患者調査' },
  '0004003256': {
    id: 'economic-census-activity',
    name: '経済センサス‐活動調査',
  },
  '0004003259': {
    id: 'economic-census-activity',
    name: '経済センサス‐活動調査',
  },
  '0004003261': {
    id: 'economic-census-activity',
    name: '経済センサス‐活動調査',
  },
  '0004008452': { id: 'employment-structure-survey', name: '就業構造基本調査' },
  '0004026105': { id: 'patient-survey', name: '患者調査' },
  '0004026840': { id: 'health-admin-report', name: '衛生行政報告例' },
  '0004026844': { id: 'health-admin-report', name: '衛生行政報告例' },
  '0004026870': { id: 'health-admin-report', name: '衛生行政報告例' },
  '0004026904': { id: 'health-admin-report', name: '衛生行政報告例' },
  '0004026906': { id: 'health-admin-report', name: '衛生行政報告例' },
  '0004026929': { id: 'health-admin-report', name: '衛生行政報告例' },
  '0004026960': { id: 'health-admin-report', name: '衛生行政報告例' },
  '0004027019': { id: 'health-admin-report', name: '衛生行政報告例' },
  '0004027738': {
    id: 'regional-health-promotion-report',
    name: '地域保健・健康増進事業報告',
  },
  '0004027740': {
    id: 'regional-health-promotion-report',
    name: '地域保健・健康増進事業報告',
  },
  '0004027744': {
    id: 'regional-health-promotion-report',
    name: '地域保健・健康増進事業報告',
  },
  '0004027806': {
    id: 'regional-health-promotion-report',
    name: '地域保健・健康増進事業報告',
  },
  '0004027833': {
    id: 'regional-health-promotion-report',
    name: '地域保健・健康増進事業報告',
  },
  // 公開 blog source.json が保持する e-Stat 表 URL・統計名を照合（2026-09-07）。
  '0003445244': { id: 'census', name: '国勢調査' },
  '0003448099': { id: 'industrial-statistics', name: '工業統計調査' },
  // 旧 statdisp_id は現行 API では status=300 だが、統計コード00650302と環境省公表で
  // 平成28年度表の調査名を確認（2026-09-07）。履歴指標の taxonomy だけを正式調査へ接続する。
  // https://www.e-stat.go.jp/stat-search/files?page=1&toukei=00650302&tstat=000001115436
  '0003368792': {
    id: 'noise-control-law-status-survey',
    name: '騒音規制法施行状況調査',
  },
  '0003130738': {
    id: 'port-statistics',
    name: '港湾調査（港湾統計年報）',
  },
  '0003441258': {
    id: 'retail-price-survey',
    name: '小売物価統計調査（構造編）',
  },
  // 家計調査・品目分類（2020年改定）年間収入五分位階級の金額（年次）。
  // https://www.e-stat.go.jp/stat-search/database?layout=dataset&statdisp_id=0003348240
  // 確認: 2026-09-06。月次の総数・金額/数量は公式API変更告知でIDを確認。
  // https://www.e-stat.go.jp/api/node/208
  '0003348240': { id: 'kakei-chousa', name: '家計調査（品目別）' },
  '0003343671': { id: 'kakei-chousa', name: '家計調査（品目別）' },
  '0003343670': { id: 'kakei-chousa', name: '家計調査（品目別）' },
  // 月次CPIは年報そのものではなく同一統計の時系列。cpi-annualは既存URL互換のID。
  // master名称は「消費者物価指数」、年次/月次を含む公式結果ページへ接続する。
  // https://www.e-stat.go.jp/stat-search/database?layout=dataset&statdisp_id=0003427113
  // https://www.stat.go.jp/data/cpi/1.html (確認: 2026-09-06)
  '0003427113': { id: 'cpi-annual', name: '消費者物価指数' },
  // 既存生成辞書の手動追記を正典へ回収し、再生成で失わない。metric は displayName を持たない。
  // https://www.e-stat.go.jp/stat-search/database?layout=dataset&statdisp_id=0003423613
  // 確認: 2026-09-06。住民基本台帳人口移動報告・月報の都道府県間移動表。
  '0003423613': {
    id: 'resident-registry-migration-report',
    name: '住民基本台帳人口移動報告',
  },
};
