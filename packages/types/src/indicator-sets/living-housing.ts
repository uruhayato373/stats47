import type { IndicatorSet } from "../indicator-set";

export const LIVING_HOUSING_SET: IndicatorSet = {
  key: "living-housing",
  title: "暮らし・住まい",
  description:
    "都道府県別の空き家比率・持ち家比率・世帯構造・人口密度を地図とランキングで比較。暮らしの地域差を47都道府県のデータで確認できます。",
  category: "lifestyle",
  usage: "theme",
  indicators: [
    // 住宅
    { rankingKey: "vacant-housing-ratio", shortLabel: "空き家率", role: "primary" },
    { rankingKey: "owner-occupied-housing-ratio", shortLabel: "持ち家率", role: "secondary" },
    { rankingKey: "dwelling-per-floor-area", shortLabel: "延べ面積", role: "secondary" },
    // 世帯
    { rankingKey: "households", shortLabel: "世帯数", role: "context" },
    { rankingKey: "nuclear-family-households-ratio", shortLabel: "核家族世帯率", role: "context" },
    { rankingKey: "elderly-couple-only-household-ratio", shortLabel: "高齢夫婦世帯", role: "secondary" },
    { rankingKey: "single-person-household-old-population-ratio", shortLabel: "高齢単身世帯率", role: "context" },
    // 人口密度・土地
    { rankingKey: "population-density-per-km2-inhabitable-area", shortLabel: "人口密度", role: "secondary" },
    { rankingKey: "habitable-area-ratio", shortLabel: "可住地面積割合", role: "context" },
    { rankingKey: "densely-inhabited-district-population-density", shortLabel: "DID人口密度", role: "context" },
    // 婚姻
    { rankingKey: "ratio-never-married-15-plus", shortLabel: "未婚率", role: "secondary" },
    { rankingKey: "marriages", shortLabel: "婚姻件数", role: "context" },
    { rankingKey: "divorces", shortLabel: "離婚件数", role: "context" },
  ],
  keywords: [
    "空き家",
    "持ち家",
    "人口密度",
    "世帯構造",
    "未婚率",
    "都道府県",
    "ランキング",
  ],
};
