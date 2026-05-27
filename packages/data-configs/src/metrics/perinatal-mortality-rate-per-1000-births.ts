import type { MetricConfig } from "../types";

export const perinatalMortalityRatePer1000Births: MetricConfig = {
  "key": "perinatal-mortality-rate-per-1000-births",
  "title": "周産期死亡率",
  "unit": "‐",
  "category": "population",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010209",
    "cdCat01": "#I07106",
    "displayName": "人口動態統計",
    "url": "https://www.mhlw.go.jp/toukei/list/81-1.html",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2023,
    "to": 2023,
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
  "seoTitle": "周産期死亡率ランキング都道府県【2023年】｜1位秋田県（6.1‐）",
  "seoDescription": "2023年の周産期死亡率の都道府県別ランキング。1位秋田県（6.1‐）、最下位沖縄県（2.3‐）で2.7倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
  "isFeatured": false,
  "featuredOrder": 0,
};
