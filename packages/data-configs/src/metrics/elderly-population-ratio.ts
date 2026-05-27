import type { MetricConfig } from "../types";

export const elderlyPopulationRatio: MetricConfig = {
  "key": "elderly-population-ratio",
  "title": "65歳以上人口割合",
  "unit": "％",
  "category": "population",
  "source": {
    "kind": "estat",
    "statsDataId": "0000020301",
    "cdCat01": "#A03506",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "city",
  ],
  "years": {
    "years": [
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
    "decimalPlaces": 1,
  },
  "calculation": {
    "isCalculated": false,
  },
  "seoTitle": "65歳以上人口割合ランキング市区町村【2020年】｜1位群馬県 南牧村（65.24％）",
  "seoDescription": "2020年の65歳以上人口割合の市区町村別ランキング。1位群馬県 南牧村（65.24％）、最下位静岡県 浜松市 浜名区（0％）で地図やグラフで市区町村を比較。",
  "isActive": true,
  "isFeatured": false,
  "featuredOrder": 0,
};
