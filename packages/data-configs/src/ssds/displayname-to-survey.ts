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
  社会生活基本調査: "social-life-basic-survey",
  賃金構造基本統計調査: "wage-structure-survey",
  人口動態統計: "vital-statistics",
  人口動態調査: "vital-statistics",
  社会教育調査: "social-education-survey",
  衛生行政報告例: "health-admin-report",
  "住宅・土地統計調査": "housing-land-survey",
  就業構造基本調査: "employment-structure-survey",
  個人企業経済調査: "sole-proprietor-survey",
  商業動態統計調査: "commercial-dynamics-survey",
  作物統計調査: "crop-statistics",
  水質汚濁物質排出量総合調査: "water-pollution-survey",
  患者調査: "patient-survey",
  病院報告: "hospital-report",
  国勢調査: "census",
  人口推計: "population-estimates",
  社会福祉施設等調査: "social-welfare-facility-survey",
  // 既存 survey マスタに無いが頻度のある一次統計
  海面漁業生産統計調査: "fishery-aquaculture-production",
  水害統計調査: "flood-statistics",
  建設工事受注動態統計調査: "construction-orders-statistics",
  地方公務員給与実態調査: "local-public-employee-salary",
  畜産統計調査: "livestock-statistics",
  工場立地動向調査: "factory-location-survey",
};

/**
 * registry に同じ統計表の metric が無く、displayName consensus を作れない一次統計。
 * e-Stat の統計表 ID は恒久 ID なので、ThemeCatalog 等の直接参照も同じ resolver で解決する。
 */
export const STATS_DATA_ID_TO_SURVEY_OVERRIDE: Record<
  string,
  { id: string; name: string }
> = {
  "0003130738": {
    id: "port-statistics",
    name: "港湾調査（港湾統計年報）",
  },
  "0003441258": {
    id: "retail-price-survey",
    name: "小売物価統計調査（構造編）",
  },
};
