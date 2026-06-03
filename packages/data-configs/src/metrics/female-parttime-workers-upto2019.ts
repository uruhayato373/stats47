import type { MetricConfig } from "../types";

export const femaleParttimeWorkersUpto2019: MetricConfig = {
  "key": "female-parttime-workers-upto2019",
  "title": "女性パートタイム労働者数",
  "subtitle": "〜2018年",
  "unit": "人",
  "category": "laborwage",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010206",
    "cdCat01": "#F03230",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2019,
    "to": 2019,
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
  "isActive": false,
  "isFeatured": false,
  "featuredOrder": 0,
};
