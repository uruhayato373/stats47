import type { MetricConfig } from "../types";

export const publicBondExpensesPurposePrefecture: MetricConfig = {
  "key": "public-bond-expenses-purpose-prefecture",
  "title": "公債費",
  "subtitle": "都道府県財政",
  "unit": "",
  "category": "administrativefinancial",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010104",
    "cdCat01": "D310313",
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
    "decimalPlaces": 0,
  },
  "calculation": {
    "isCalculated": false,
  },
  "seoTitle": "公債費（目的別歳出内訳）",
  "isActive": true,
  "isFeatured": false,
  "featuredOrder": 0,
};
