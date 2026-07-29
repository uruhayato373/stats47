import type { MetricConfig } from "../types";

export const householdTypesByArea: MetricConfig = {
  "key": "household-types-by-area",
  "title": "家族類型別普通世帯数（総数）",
  "unit": "世帯",
  "category": "population",
  "source": {
    "kind": "estat",
    "statsDataId": "0003355518",
    "cdCat01": "0",
    "cdCat02": "0",
    "displayName": "家族類型別普通世帯数（総数, 2018年）",
    "url": "https://www.e-stat.go.jp/dbview?sid=0003355518",
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
    "minValueType": "zero",
  },
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 1,
  },
  "isActive": true,
};
