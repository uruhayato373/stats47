import type { MetricConfig } from "../types";

export const restaurantsPer: MetricConfig = {
  "key": "restaurants-per",
  "title": "飲食店数",
  "unit": "店",
  "category": "population",
  "source": {
    "kind": "estat",
    "statsDataId": "0000020308",
    "cdCat01": "#H06107",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "city",
  ],
  "years": {
    "from": 2006,
    "to": 2006,
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
  "groupKey": "restaurants-per",
  "isActive": false,
  "isFeatured": false,
  "featuredOrder": 0,
};
