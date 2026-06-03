import type { MetricConfig } from "../types";

export const waterSupplyPopulationRatio2012on: MetricConfig = {
  "key": "water-supply-population-ratio-2012on",
  "title": "上水道給水人口比率",
  "subtitle": "2012年以降",
  "unit": "％",
  "category": "population",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010208",
    "cdCat01": "#H0520101",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2022,
    "to": 2022,
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
  "seoTitle": "上水道給水人口比率（2012－）",
  "isActive": true,
  "isFeatured": false,
  "featuredOrder": 0,
};
