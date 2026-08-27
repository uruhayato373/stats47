/**
 * 人口ピラミッドの e-Stat 依存 (CROSS-PAGE-DATA-SSOT-01 WP4)
 *
 * ★pyramid-chart は componentProps が空 ({}) で、実際の依存 (statsDataId × 34 の年齢×性別
 *   カテゴリ) は app の fetch-population-pyramid.ts にハードコードされていた。そのため
 *   catalog から依存を機械抽出できず、監査の「期待集合」に pyramid の 34 request が入らなかった。
 *   ここを SSOT にして app fetch と依存 collector (WP4) が同じ集合を使う。
 *
 * 社会・人口統計体系 (0000010101): 5 歳階級男女別が A1201〜A1216 (0〜79歳)、
 * 80歳以上は A1418 で一括。コード接尾 01=男 / 02=女。17 階級 × 2 = 34 request。
 */
export const PYRAMID_STATS_DATA_ID = "0000010101";

export const PYRAMID_AGE_GROUPS = [
  { base: "A1201", label: "0〜4歳", metricSlug: "0-4" },
  { base: "A1202", label: "5〜9歳", metricSlug: "5-9" },
  { base: "A1203", label: "10〜14歳", metricSlug: "10-14" },
  { base: "A1204", label: "15〜19歳", metricSlug: "15-19" },
  { base: "A1205", label: "20〜24歳", metricSlug: "20-24" },
  { base: "A1206", label: "25〜29歳", metricSlug: "25-29" },
  { base: "A1207", label: "30〜34歳", metricSlug: "30-34" },
  { base: "A1208", label: "35〜39歳", metricSlug: "35-39" },
  { base: "A1209", label: "40〜44歳", metricSlug: "40-44" },
  { base: "A1210", label: "45〜49歳", metricSlug: "45-49" },
  { base: "A1211", label: "50〜54歳", metricSlug: "50-54" },
  { base: "A1212", label: "55〜59歳", metricSlug: "55-59" },
  { base: "A1213", label: "60〜64歳", metricSlug: "60-64" },
  { base: "A1214", label: "65〜69歳", metricSlug: "65-69" },
  { base: "A1215", label: "70〜74歳", metricSlug: "70-74" },
  { base: "A1216", label: "75〜79歳", metricSlug: "75-79" },
  { base: "A1418", label: "80歳以上", metricSlug: "80-plus" },
] as const;

export interface PyramidCategoryCode {
  code: string;
  metricKey: string;
  label: string;
  sex: "male" | "female";
}

/** 34 の (年齢×性別) カテゴリコードを列挙する。app fetch と依存 collector が共有する。 */
export function enumeratePyramidCategoryCodes(): PyramidCategoryCode[] {
  return PYRAMID_AGE_GROUPS.flatMap((ag) => [
    {
      code: `${ag.base}01`,
      metricKey: `theme-population-pyramid-${ag.metricSlug}-male`,
      label: ag.label,
      sex: "male" as const,
    },
    {
      code: `${ag.base}02`,
      metricKey: `theme-population-pyramid-${ag.metricSlug}-female`,
      label: ag.label,
      sex: "female" as const,
    },
  ]);
}

/** ThemeCatalog / web reader が共有する、R2 専用の34系列参照。 */
export function buildPopulationPyramidSeriesRefs() {
  return enumeratePyramidCategoryCodes().map(({ metricKey, label, sex }) => ({
    metricKey,
    label: `${label}・${sex === "male" ? "男性" : "女性"}`,
    colorRole: sex === "male" ? ("population" as const) : ("female" as const),
  }));
}
