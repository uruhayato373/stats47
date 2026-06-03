import type { MetricConfig } from "../types";

export const consumerPriceDifferenceIndexCultureRecreation: MetricConfig = {
  "key": "consumer-price-difference-index-culture-recreation",
  "title": "消費者物価地域差指数",
  "subtitle": "教養娯楽",
  "unit": "‐",
  "category": "economy",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010212",
    "cdCat01": "#L04424",
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
  "seoTitle": "消費者物価地域差指数（教養娯楽）",
  "isActive": true,
  "isFeatured": false,
  "featuredOrder": 0,
};
