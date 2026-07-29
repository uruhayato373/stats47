import type { MetricConfig } from "../types";

export const departmentStores10Per: MetricConfig = {
  "key": "department-stores-10-per",
  "title": "百貨店数",
  "subtitle": "市区町村・人口10万当たり",
  "unit": "店",
  "category": "laborwage",
  "source": {
    "kind": "estat",
    "statsDataId": "0000020308",
    "cdCat01": "#H06111",
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
  "groupKey": "department-stores-10-per",
  "isActive": false,
};
