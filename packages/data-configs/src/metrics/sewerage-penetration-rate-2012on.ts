import type { MetricConfig } from "../types";

export const seweragePenetrationRate2012on: MetricConfig = {
  "key": "sewerage-penetration-rate-2012on",
  "title": "下水道普及率",
  "subtitle": "2012年以降",
  "unit": "％",
  "category": "energy",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010208",
    "cdCat01": "#H0530401",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2021,
    "to": 2021,
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
  "seoTitle": "下水道普及率（2012－）",
  "isActive": true,
};
