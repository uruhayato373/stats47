import type { MetricConfig } from "../types";

export const neonatalMortalityRatePer1000Births: MetricConfig = {
  "key": "neonatal-mortality-rate-per-1000-births",
  "title": "新生児死亡率",
  "unit": "出生千対",
  "category": "population",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010209",
    "cdCat01": "#I07102",
    "displayName": "人口動態統計",
    "url": "https://www.mhlw.go.jp/toukei/list/81-1.html",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "years": [
      1988,
      1989,
      1990,
      1991,
      1992,
      1993,
      1994,
      1995,
      1996,
      1997,
      1998,
      2023,
    ],
  },
  "yearFormat": "fiscal",
  "visualization": {
    "colorScheme": "interpolateBlues",
    "colorSchemeType": "sequential",
    "minValueType": "data-min",
  },
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 1,
  },
  "calculation": {
    "isCalculated": false,
  },
  "seoTitle": "新生児死亡率ランキング都道府県【2023年】｜1位秋田県（2.5‐）",
  "seoDescription": "2023年の新生児死亡率の都道府県別ランキング。1位秋田県（2.5‐）、最下位高知県（0.3‐）で8.3倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
