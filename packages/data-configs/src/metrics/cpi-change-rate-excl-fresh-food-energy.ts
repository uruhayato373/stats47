import type { MetricConfig } from "../types";

export const cpiChangeRateExclFreshFoodEnergy: MetricConfig = {
  "key": "cpi-change-rate-excl-fresh-food-energy",
  "title": "消費者物価指数変化率",
  "subtitle": "コアコアCPI",
  "description": "コアコアCPIとは、生鮮食品及びエネルギーを除いた総合消費者物価指数の変化率。",
  "unit": "％",
  "category": "economy",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010212",
    "cdCat01": "#L04115",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
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
    "colorScheme": "interpolateRdBu",
    "colorSchemeType": "diverging",
    "divergingMidpoint": "zero",
    "isReversed": false,
    "isSymmetrized": false,
  },
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 1,
  },
  "calculation": {
    "isCalculated": false,
  },
  "seoTitle": "消費者物価指数対前年変化率（生鮮食品及びエネルギーを除く総合）",
  "isActive": false,
  "isFeatured": false,
  "featuredOrder": 0,
};
