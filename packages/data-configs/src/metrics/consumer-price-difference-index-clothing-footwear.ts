import type { MetricConfig } from "../types";

export const consumerPriceDifferenceIndexClothingFootwear: MetricConfig = {
  "key": "consumer-price-difference-index-clothing-footwear",
  "title": "消費者物価地域差指数",
  "subtitle": "被服及び履物",
  "unit": "（全国=100）",
  "category": "economy",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010212",
    "cdCat01": "#L04420",
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
  "seoTitle": "消費者物価地域差指数（被服及び履物）",
  "isActive": true,
  "isFeatured": false,
  "featuredOrder": 0,
};
