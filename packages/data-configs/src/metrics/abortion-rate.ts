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
  "seoTitle": "中絶実施率ランキング都道府県｜なぜ宮崎が最多?茨城の2.6倍【2020】",
  "seoDescription": "同じ日本でも人工妊娠中絶の実施率は都道府県で2.6倍違います──1位宮崎県8.2‰、最下位茨城県3.1‰。地域差が生まれる背景と47都道府県の分布を2020年データで比較します。",
  "isActive": true,
  "isFeatured": false,
  "featuredOrder": 0,
};
