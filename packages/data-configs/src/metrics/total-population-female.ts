import type { MetricConfig } from "../types";

export const totalPopulationFemale: MetricConfig = {
  "key": "total-population-female",
  "title": "総人口",
  "subtitle": "女性",
  "unit": "万人",
  "category": "population",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010201",
    "cdCat01": "#A0110002",
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
  "isActive": false,
  "isFeatured": false,
  "featuredOrder": 0,
};
