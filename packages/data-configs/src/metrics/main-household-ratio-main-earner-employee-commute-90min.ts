import type { MetricConfig } from "../types";

export const mainHouseholdRatioMainEarnerEmployeeCommute90min: MetricConfig = {
  "key": "main-household-ratio-main-earner-employee-commute-90min",
  "title": "雇用者世帯の通勤時間",
  "subtitle": "主世帯・1時間30分以上",
  "unit": "主世帯千世帯対",
  "category": "population",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010208",
    "cdCat01": "#H03102",
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
    "decimalPlaces": 1,
  },
  "calculation": {
    "isCalculated": false,
  },
  "seoTitle": "家計を主に支える者が雇用者である主世帯比率（通勤時間1時間30分以上）",
  "isActive": false,
  "isFeatured": false,
  "featuredOrder": 0,
};
