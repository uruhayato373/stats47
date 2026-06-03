import type { MetricConfig } from "../types";

export const waterSupplyPopulationRatioPre2011: MetricConfig = {
  "key": "water-supply-population-ratio-pre2011",
  "title": "上水道給水人口比率",
  "subtitle": "～2011年",
  "unit": "％",
  "category": "population",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010208",
    "cdCat01": "#H05201",
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
  "seoTitle": "上水道給水人口比率（－2011）",
  "isActive": true,
  "isFeatured": false,
  "featuredOrder": 0,
};
