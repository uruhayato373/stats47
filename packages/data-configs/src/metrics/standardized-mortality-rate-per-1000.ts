import type { MetricConfig } from "../types";

export const standardizedMortalityRatePer1000: MetricConfig = {
  "key": "standardized-mortality-rate-per-1000",
  "title": "標準化死亡率",
  "unit": "人口千対",
  "category": "population",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010209",
    "cdCat01": "#I05101",
    "displayName": "人口動態統計",
    "url": "https://www.mhlw.go.jp/toukei/list/81-1.html",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "years": [
      2010,
      2015,
      2020,
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
    "decimalPlaces": 2,
  },
  "calculation": {
    "isCalculated": false,
  },
  "seoTitle": "標準化死亡率ランキング都道府県【2020年】｜1位青森県（1.88‐）",
  "seoDescription": "2020年の標準化死亡率の都道府県別ランキング。1位青森県（1.88‐）、最下位滋賀県（1.35‐）で1.4倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
