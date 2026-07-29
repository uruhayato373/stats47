import type { MetricConfig } from "../types";

export const householdRatioMainEarnerEmployeeCommute90min: MetricConfig = {
  "key": "household-ratio-main-earner-employee-commute-90min",
  "title": "雇用者世帯の通勤時間",
  "subtitle": "普通世帯・90分以上",
  "unit": "普通世帯千世帯対",
  "category": "population",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010208",
    "cdCat01": "#H03101",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2018,
    "to": 2018,
  },
  "yearFormat": "fiscal",
  "visualization": {
    "colorScheme": "interpolateBlues",
    "colorSchemeType": "sequential",
    "minValueType": "data-min",
  },
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 1,
  },
  "calculation": {
    "isCalculated": false,
  },
  "seoTitle": "家計を主に支える者が雇用者である普通世帯比率（通勤時間90分以上）",
  "isActive": true,
};
