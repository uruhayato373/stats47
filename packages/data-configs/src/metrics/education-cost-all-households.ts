import type { MetricConfig } from "../types";

export const educationCostAllHouseholds: MetricConfig = {
  "key": "education-cost-all-households",
  "title": "教育費",
  "subtitle": "全世帯",
  "unit": "円",
  "category": "economy",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010112",
    "cdCat01": "L320108",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm"
  },
  "entities": [
    "prefecture",
    "city"
  ],
  "years": "all",
  "yearFormat": "fiscal",
  "visualization": {
    "colorScheme": "interpolatePurples",
    "colorSchemeType": "sequential",
    "minValueType": "data-min"
  },
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 0
  },
  "calculation": {
    "isCalculated": false,
    "normalizationOptions": []
  },
  "isActive": true,
};
