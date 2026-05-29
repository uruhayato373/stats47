import type { MetricConfig } from "../types";

export const consolidatedRealDeficitRatioMunicipal: MetricConfig = {
  "key": "consolidated-real-deficit-ratio-municipal",
  "title": "連結実質赤字比率",
  "unit": "％",
  "category": "economy",
  "source": {
    "kind": "estat",
    "statsDataId": "0000020304",
    "cdCat01": "#D02215",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "city",
  ],
  "years": {
    "from": 2016,
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
    "decimalPlaces": 0,
  },
  "calculation": {
    "isCalculated": false,
  },
  "seoTitle": "連結実質赤字比率（市町村財政）",
  "isActive": false,
  "isFeatured": false,
  "featuredOrder": 0,
};
