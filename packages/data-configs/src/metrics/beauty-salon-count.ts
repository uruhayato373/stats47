import type { MetricConfig } from "../types";

export const beautySalonCount: MetricConfig = {
  "key": "beauty-salon-count",
  "title": "美容所数",
  "subtitle": "美容所の施設数",
  "unit": "施設",
  "category": "socialsecurity",
  "source": {
    "kind": "estat",
    "statsDataId": "0004027011",
    "cdTab": "1030",
    "cdCat01": "120",
    "displayName": "衛生行政報告例",
    "url": "https://www.mhlw.go.jp/toukei/saikin/hw/eisei_houkoku/20/",
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
    "decimalPlaces": 0,
  },
  "calculation": {
    "isCalculated": false,
    "normalizationOptions": [
      {
        "type": "per_population",
        "label": "人口10万人あたり",
        "unit": "施設/10万人",
        "scaleFactor": 100000,
        "decimalPlaces": 1,
      },
      {
        "type": "per_area",
        "label": "面積100km²あたり",
        "unit": "施設/100km²",
        "scaleFactor": 100,
        "decimalPlaces": 2,
      },
    ],
  },
  "seoTitle": "美容所数ランキング都道府県【2020年】｜1位東京都（24,713施設）",
  "seoDescription": "2020年の美容所数の都道府県別ランキング。1位東京都（24,713施設）、最下位鳥取県（1,550施設）で15.9倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
