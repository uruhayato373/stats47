import type { MetricConfig } from "../types";

export const abortionRate: MetricConfig = {
  "key": "abortion-rate",
  "title": "人工妊娠中絶実施率",
  "unit": "‰",
  "category": "socialsecurity",
  "source": {
    "kind": "estat",
    "statsDataId": "0004026922",
    "displayName": "衛生行政報告例",
    "url": "https://www.mhlw.go.jp/toukei/list/36-19.html",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "years": [
      2005,
      2010,
      2015,
      2016,
      2017,
      2018,
      2019,
      2020,
    ],
  },
  "yearFormat": "calendar",
  "visualization": {
    "colorScheme": "interpolateReds",
    "colorSchemeType": "sequential",
    "minValueType": "zero",
  },
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 1,
  },
  "calculation": {
    "isCalculated": false,
  },
  "groupKey": "reproductive-health",
  "seoTitle": "人工妊娠中絶実施率ランキング都道府県【2020年】｜1位宮崎県（8.2‰）",
  "seoDescription": "2020年の人工妊娠中絶実施率の都道府県別ランキング。1位宮崎県（8.2‰）、最下位茨城県（3.1‰）で2.6倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
  "isFeatured": false,
  "featuredOrder": 0,
};
