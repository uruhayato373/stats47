import type { ValueCorrection } from "../../../packages/data-configs/src/types";

const KAWASAKI_INDUSTRY_TABLE =
  "https://www.city.kawasaki.jp/170/cmsfiles/contents/0000025/25684/1986-3hyou.xls";
const KAWASAKI_INDUSTRY_SERIES =
  "https://www.city.kawasaki.jp/170/cmsfiles/contents/0000053/53475/kogyo.xls";

/** 社会・人口統計体系の製造品出荷額等 (C3401) の川崎市の誤り。2026-11-04 オーナー決定で川崎市の公表値へ置き換える。 */
export const KAWASAKI_MANUFACTURING_CORRECTIONS: readonly ValueCorrection[] = [
  {
    areaCode: "14131",
    year: 1986,
    sourceValue: 5840455,
    value: 3066860,
    reason: "川崎区の欄が全市の値とほぼ同じで、県計の超過 2,773,565 が他の 6 区の合計と 1 しか違わない",
    sourceUrl: KAWASAKI_INDUSTRY_TABLE,
  },
  {
    areaCode: "14130",
    year: 1986,
    sourceValue: 8614018,
    value: 5842937,
    reason: "誤った川崎区の値を含む区の合計になっている",
    sourceUrl: KAWASAKI_INDUSTRY_TABLE,
  },
  {
    areaCode: "14130",
    year: 1983,
    sourceValue: 6471684,
    value: 6528504,
    reason: "市の欄が区の合計より 58,429 小さい。区の値と県計は公表値と合う",
    sourceUrl: KAWASAKI_INDUSTRY_SERIES,
  },
];
