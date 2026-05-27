import type { MetricConfig } from "../types";

export const largeScaleRetailStores10Per: MetricConfig = {
  "key": "large-scale-retail-stores-10-per",
  "title": "大型小売店数",
  "unit": "店",
  "category": "commercial",
  "source": {
    "kind": "estat",
    "statsDataId": "0000020308",
    "cdCat01": "#H06109",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "city",
  ],
  "years": {
    "years": [
      1981,
      1986,
      1991,
      1996,
      2001,
      2006,
    ],
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
  "groupKey": "large-scale-retail-stores-10-per",
  "isActive": false,
  "isFeatured": false,
  "featuredOrder": 0,
};
