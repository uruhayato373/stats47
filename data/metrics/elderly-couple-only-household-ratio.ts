import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const elderlyCoupleOnlyHouseholdRatio: MetricConfig = {
  "key": "elderly-couple-only-household-ratio",
  "title": "高齢夫婦のみの世帯の割合",
  "description": "夫が65歳以上、妻が60歳以上の夫婦のみの世帯数を一般世帯数で除して100を掛けた割合です。",
  "unit": "％",
  "category": "population",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010201",
    "cdCat01": "#A06302",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
    "city",
  ],
  "years": {
    "years": [
      1990,
      1995,
      2000,
      2005,
      2010,
      2015,
      2020,
    ],
  },
  "yearExclusions": [
    {
      "years": [
        1985,
      ],
      "reason": "2026-10 の移行時に当時の years から引き継いだ除外 (まだ判断していない。根拠が無ければ外して年を戻す)",
    },
  ],
  "yearFormat": "calendar",
  "visualization": {
    ...DEFAULT_METRIC_PRESENTATION,
    "colorScheme": "interpolateBlues",
    "colorSchemeType": "sequential",
  },
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 2,
  },
  "calculation": {
    "isCalculated": false,
  },
  "seoTitle": "高齢夫婦のみの世帯の割合ランキング都道府県【2020年】｜1位奈良県（15.94％）",
  "seoDescription": "2020年の高齢夫婦のみの世帯の割合の都道府県別ランキング。1位奈良県（15.94％）、最下位東京都（7.82％）で2.0倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
