import type { MetricConfig } from "../types";

export const woodenHousingRatio: MetricConfig = {
  "key": "wooden-housing-ratio",
  "title": "木造住宅率",
  "subtitle": "住宅のうち木造構造の割合",
  "unit": "％",
  "category": "construction",
  "source": {
    "kind": "estat",
    "statsDataId": "0004015760",
    "cdCat01": "0",
    "cdCat02": "00",
    "axisRatio": {
      "axis": "cat03",
      "numeratorCodes": ["1"],
      "denominatorCodes": ["0"],
    },
    "displayName": "住宅・土地統計調査",
    "url": "https://www.stat.go.jp/data/jyutaku/2023/index.html",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2023,
    "to": 2023,
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
  },
  "seoTitle": "木造住宅率ランキング都道府県【2023年】｜1位秋田県（88.8％）",
  "seoDescription": "2023年の木造住宅率の都道府県別ランキング。1位秋田県（88.8％）、最下位沖縄県（3.5％）で25.4倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
