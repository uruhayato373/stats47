import type { MetricConfig } from "../types";

export const femaleParttimeWorkers: MetricConfig = {
  "key": "female-parttime-workers",
  "title": "女性パートタイム労働者数",
  "subtitle": "現行",
  "unit": "人",
  "category": "laborwage",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010206",
    "cdCat01": "#F03241",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2023,
    "to": 2023,
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
  "isActive": true,
  "isFeatured": false,
  "featuredOrder": 0,
};
