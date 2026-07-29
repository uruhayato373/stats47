import type { MetricConfig } from "../types";

export const infantMortalityRatePer1000Births: MetricConfig = {
  "key": "infant-mortality-rate-per-1000-births",
  "title": "乳児死亡率",
  "unit": "出生千対",
  "category": "population",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010209",
    "cdCat01": "#I07104",
    "displayName": "人口動態統計",
    "url": "https://www.mhlw.go.jp/toukei/list/81-1.html",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "years": [
      2008,
      2009,
      2010,
      2011,
      2012,
      2013,
      2014,
      2015,
      2016,
      2017,
      2018,
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
  "seoTitle": "乳児死亡率ランキング都道府県【2023年】｜1位鳥取県（3.1‐）",
  "seoDescription": "2023年の乳児死亡率の都道府県別ランキング。1位鳥取県（3.1‐）、最下位岡山県（1‐）で3.1倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
