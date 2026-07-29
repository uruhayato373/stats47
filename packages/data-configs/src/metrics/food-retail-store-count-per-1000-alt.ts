import type { MetricConfig } from "../types";

export const foodRetailStoreCountPer1000Alt: MetricConfig = {
  "key": "food-retail-store-count-per-1000-alt",
  "title": "飲食料品小売店数",
  "subtitle": "1000人当たり（更新）",
  "unit": "店",
  "category": "commercial",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010208",
    "cdCat01": "#H06129",
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
    "decimalPlaces": 2,
  },
  "calculation": {
    "isCalculated": false,
  },
  "isActive": false,
};
