import type { MetricConfig } from "../types";

export const dentalHygienistRate: MetricConfig = {
  "key": "dental-hygienist-rate",
  "title": "歯科衛生士率（人口10万対）",
  "unit": "人",
  "category": "socialsecurity",
  "source": {
    "kind": "estat",
    "statsDataId": "0004027006",
    "displayName": "衛生行政報告例",
    "url": "https://www.mhlw.go.jp/toukei/list/36-19.html",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2020,
    "to": 2020,
  },
  "yearFormat": "calendar",
  "visualization": {
    "colorScheme": "interpolateBlues",
    "colorSchemeType": "sequential",
    "minValueType": "zero",
  },
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 1,
  },
  "calculation": {
    "isCalculated": false,
    "normalizationOptions": [
      {
        "type": "per_population",
        "label": "人口10万人あたり",
        "unit": "人/10万人",
        "scaleFactor": 100000,
        "decimalPlaces": 1,
      },
      {
        "type": "per_area",
        "label": "面積100km²あたり",
        "unit": "人/100km²",
        "scaleFactor": 100,
        "decimalPlaces": 2,
      },
    ],
  },
  "groupKey": "dental-workforce",
  "seoTitle": "歯科衛生士率（人口10万対）ランキング都道府県【2020年】｜1位徳島県（180.2人）",
  "seoDescription": "2020年の歯科衛生士率（人口10万対）の都道府県別ランキング。1位徳島県（180.2人）、最下位青森県（78.4人）で2.3倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
