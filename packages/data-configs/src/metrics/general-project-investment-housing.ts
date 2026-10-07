import type { MetricConfig } from "../types";

export const generalProjectInvestmentHousing: MetricConfig = {
  "key": "general-project-investment-housing",
  "title": "一般事業投資額",
  "subtitle": "住宅",
  "unit": "千円",
  "category": "construction",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010104",
    "cdCat01": "D5203",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 1975,
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
  "isActive": true,
};
