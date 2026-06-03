import type { MetricConfig } from "../types";

export const migrantWorkerRatioSalesFarm: MetricConfig = {
  "key": "migrant-worker-ratio-sales-farm",
  "title": "出稼者比率",
  "unit": "％",
  "category": "agriculture",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010206",
    "cdCat01": "#F0260101",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2004,
    "to": 2004,
  },
  "yearFormat": "fiscal",
  "visualization": {
    "colorScheme": "interpolateGreens",
    "colorSchemeType": "sequential",
    "minValueType": "data-min",
  },
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 2,
  },
  "calculation": {
    "isCalculated": false,
  },
  "seoTitle": "出稼者比率（販売農家）",
  "isActive": true,
  "isFeatured": false,
  "featuredOrder": 0,
};
