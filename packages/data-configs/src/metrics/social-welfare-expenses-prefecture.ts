import type { MetricConfig } from "../types";

export const socialWelfareExpensesPrefecture: MetricConfig = {
  "key": "social-welfare-expenses-prefecture",
  "title": "社会福祉費",
  "subtitle": "都道府県財政",
  "unit": "",
  "category": "socialsecurity",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010104",
    "cdCat01": "D3103031",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "years": [
      1994,
      1995,
      1996,
      1997,
      1998,
      1999,
      2000,
      2001,
      2002,
      2003,
      2004,
      2005,
      2022,
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
  "groupKey": "social-welfare-expenses-prefecture",
  "isActive": false,
  "isFeatured": false,
  "featuredOrder": 0,
};
