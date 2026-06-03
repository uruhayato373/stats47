import type { MetricConfig } from "../types";

export const childWelfareExpensesPrefecture: MetricConfig = {
  "key": "child-welfare-expenses-prefecture",
  "title": "児童福祉費",
  "subtitle": "都道府県財政",
  "unit": "千円",
  "category": "educationsports",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010104",
    "cdCat01": "D3103033",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2022,
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
  "groupKey": "child-welfare-expenses-prefecture",
  "isActive": true,
  "isFeatured": false,
  "featuredOrder": 0,
};
