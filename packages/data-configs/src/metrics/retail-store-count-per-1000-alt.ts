import type { MetricConfig } from "../types";

export const retailStoreCountPer1000Alt: MetricConfig = {
  "key": "retail-store-count-per-1000-alt",
  "title": "小売店数",
  "subtitle": "1000人当たり（経済センサス）",
  "unit": "店",
  "category": "commercial",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010208",
    "cdCat01": "#H06127",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
    "city",
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
    "decimalPlaces": 2,
  },
  "calculation": {
    "isCalculated": false,
  },
  "groupKey": "retail-store-count-alt",
  "isActive": false,
  "isFeatured": false,
  "featuredOrder": 0,
};
