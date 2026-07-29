import type { MetricConfig } from "../types";

export const employeeCompensationH27: MetricConfig = {
  "key": "employee-compensation-h27",
  "title": "雇用者報酬",
  "unit": "百万円",
  "category": "laborwage",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010103",
    "cdCat01": "C1222",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2020,
    "to": 2020,
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
  "seoTitle": "雇用者報酬（平成27年基準）",
  "isActive": false,
};
