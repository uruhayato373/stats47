/**
 * SSDS の「資料源」(原典統計名) → survey id の正規化辞書。
 *
 * `cdcat01-sources.generated.json` が持つ生の原典名 (179 種) を、
 * `packages/ranking/src/data/surveys.json` の survey id に正規化する。
 *
 * 方針:
 *   - 既存の survey マスタに対応する原典は、その id にマップする (KNOWN_SOURCE_TO_SURVEY)。
 *   - マスタに無い原典 (地方財政統計年報・社会福祉施設等調査 等) は survey マスタへの
 *     追加候補。ここでは id を宣言しておき、survey マスタ拡張 (Phase 2) で実体を足す。
 *   - 辞書に無い原典名は、生成器 (build-ssds-provenance) が決定的に slug 化して
 *     auto survey id (`ssds-src:<slug>`) を割り当てる。これにより「未マッピングでも
 *     全 metric が必ず原典を 1 つ以上持つ」状態を保証する (formal な survey マスタ化は後追い)。
 *
 * head (高頻度) を優先的に既存 id へ寄せ、ロングテールは段階的にここへ追記して
 * カバレッジを上げていく。
 *
 * 出典 Excel: https://www.stat.go.jp/data/ssds/2.html (アクセス日 2026-06-02)
 */

/** 既存 survey マスタ (surveys.json) に存在する id への対応 */
export const KNOWN_SOURCE_TO_SURVEY: Record<string, string> = {
  国勢調査報告: "census",
  人口推計: "population-estimates",
  人口動態統計: "vital-statistics",
  学校基本調査報告書: "school-basic-survey",
  社会生活基本調査報告: "social-life-basic-survey",
  住宅・土地統計調査報告: "housing-land-survey",
  医療施設調査: "medical-facility-survey",
  "医療施設調査・病院報告": "medical-facility-survey",
  病院報告: "hospital-report",
  県民経済計算年報: "prefectural-accounts",
  地方財政統計年報: "local-finance",
  社会教育調査報告書: "social-education-survey",
  賃金構造基本統計調査報告: "wage-structure-survey",
  就業構造基本調査報告: "employment-structure-survey",
  衛生行政報告例: "health-admin-report",
  患者調査: "patient-survey",
  家計調査: "household-survey",
  全国家計構造調査: "national-household-survey",
  全国消費実態調査報告: "national-household-survey", // 全国家計構造調査の前身
  犯罪統計書: "police-statistics",
  交通事故統計年報: "traffic-accident-statistics",
  宿泊旅行統計調査報告: "accommodation-survey",
  "医師・歯科医師・薬剤師統計": "physician-survey",
  "医師・歯科医師・薬剤師調査": "physician-survey",
  工業統計調査: "industrial-statistics",
  商業統計調査: "commercial-statistics",
  商業統計表: "commercial-statistics",
  労働災害動向調査報告: "workplace-accident-survey",
  地域別最低賃金の全国一覧: "minimum-wage",
};

/**
 * survey マスタ未登録だが頻度が高く、Phase 2 で正式追加すべき原典。
 * 生成器はこの id をそのまま使う (auto-slug より優先)。
 * name は survey マスタ追加時の表示名。
 */
export const PROPOSED_NEW_SURVEYS: Record<string, { id: string; name: string }> = {
  社会福祉施設等調査: { id: "social-welfare-facility-survey", name: "社会福祉施設等調査" },
  都道府県決算状況調: { id: "prefectural-settlement-survey", name: "都道府県決算状況調" },
  市町村別決算状況調: { id: "municipal-settlement-survey", name: "市町村別決算状況調" },
  "経済センサス-活動調査": { id: "economic-census-activity", name: "経済センサス-活動調査" },
  "経済センサス-基礎調査": { id: "economic-census-basic", name: "経済センサス-基礎調査" },
  全国都道府県市区町村別面積調: { id: "area-survey", name: "全国都道府県市区町村別面積調" },
  "介護サービス施設・事業所調査": { id: "care-service-facility-survey", name: "介護サービス施設・事業所調査" },
  被保護者調査: { id: "public-assistance-survey", name: "被保護者調査" },
  消費者物価指数年報: { id: "cpi-annual", name: "消費者物価指数年報" },
  "小売物価統計調査（構造編）": { id: "retail-price-survey", name: "小売物価統計調査（構造編）" },
  学校保健統計調査報告書: { id: "school-health-survey", name: "学校保健統計調査報告書" },
  福祉行政報告例: { id: "welfare-admin-report", name: "福祉行政報告例" },
  事業所・企業統計調査報告: { id: "establishment-enterprise-census", name: "事業所・企業統計調査報告" },
  農林業センサス: { id: "agriculture-forestry-census", name: "農林業センサス" },
};

/** 原典名 → survey id を解決 (KNOWN > PROPOSED > null=auto-slug)。 */
export function resolveSurveyId(sourceName: string): string | null {
  return (
    KNOWN_SOURCE_TO_SURVEY[sourceName] ??
    PROPOSED_NEW_SURVEYS[sourceName]?.id ??
    null
  );
}
