import type { MetricConfig } from "../types";

export const seweragePenetrationRatePre2011: MetricConfig = {
  "key": "sewerage-penetration-rate-pre2011",
  "title": "下水道普及率",
  "subtitle": "～2011年",
  "unit": "％",
  "category": "energy",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010208",
    "cdCat01": "#H05304",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2011,
    "to": 2011,
  },
  "yearFormat": "fiscal",
  "visualization": {
    "colorScheme": "interpolateBlues",
    "colorSchemeType": "sequential",
    "minValueType": "data-min",
  },
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 1,
  },
  "calculation": {
    "isCalculated": false,
  },
  "seoTitle": "下水道普及率（－2011）",
  "isActive": true,
  "isFeatured": false,
  "featuredOrder": 0,
};
