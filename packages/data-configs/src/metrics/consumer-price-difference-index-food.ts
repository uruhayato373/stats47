import type { MetricConfig } from "../types";

export const consumerPriceDifferenceIndexFood: MetricConfig = {
  "key": "consumer-price-difference-index-food",
  "title": "消費者物価地域差指数",
  "subtitle": "食料",
  "description": "全国平均の食料価格水準を100とし、都道府県ごとの食料費目の物価水準を比較した年平均指数です。",
  "unit": "（全国=100）",
  "category": "economy",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010212",
    "cdCat01": "#L04416",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2024,
    "to": 2024,
  },
  "yearFormat": "fiscal",
  "visualization": {
    "colorScheme": "interpolateRdBu",
    "colorSchemeType": "diverging",
    "divergingMidpoint": "custom",
    "divergingMidpointValue": 100,
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
  "seoTitle": "消費者物価地域差指数（食料）",
  "isActive": true,
};
