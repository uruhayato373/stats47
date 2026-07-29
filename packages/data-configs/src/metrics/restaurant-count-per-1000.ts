import type { MetricConfig } from "../types";

export const restaurantCountPer1000: MetricConfig = {
  "key": "restaurant-count-per-1000",
  "title": "飲食店数",
  "subtitle": "1000人当たり",
  "unit": "店",
  "category": "commercial",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010208",
    "cdCat01": "#H06107",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
    "city",
  ],
  "years": {
    "years": [
      1991,
      1996,
      2001,
      2006,
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
    "normalizationOptions": [
      {
        "type": "per_population",
        "label": "人口10万人あたり",
        "unit": "店/10万人",
        "scaleFactor": 100000,
        "decimalPlaces": 1,
      },
      {
        "type": "per_area",
        "label": "面積100km²あたり",
        "unit": "店/100km²",
        "scaleFactor": 100,
        "decimalPlaces": 2,
      },
    ],
  },
  "seoTitle": "飲食店数ランキング都道府県【2006年】｜1位沖縄県（8.7店）",
  "seoDescription": "2006年の飲食店数の都道府県別ランキング。1位沖縄県（8.7店）、最下位奈良県（3.59店）で2.4倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
