import type { MetricConfig } from "../types";

export const standardizedMortalityJapanese: MetricConfig = {
  "key": "standardized-mortality-japanese",
  "title": "標準化死亡率〔日本人〕",
  "unit": "‰",
  "category": "population",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010101",
    "cdCat01": "A4301",
    "displayName": "人口動態統計",
    "url": "https://www.mhlw.go.jp/toukei/list/81-1.html",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "years": [
      1975,
      1980,
      1985,
      1990,
      1995,
      2000,
      2005,
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
  "seoTitle": "標準化死亡率〔日本人〕ランキング都道府県【2020年】｜1位青森県（1.88‰）",
  "seoDescription": "2020年の標準化死亡率〔日本人〕の都道府県別ランキング。1位青森県（1.88‰）、最下位滋賀県（1.35‰）で1.4倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
  "isFeatured": false,
  "featuredOrder": 0,
};
