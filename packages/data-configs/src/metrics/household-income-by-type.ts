import type { MetricConfig } from "../types";

export const householdIncomeByType: MetricConfig = {
  "key": "household-income-by-type",
  "title": "年間収入階級別主世帯数（総数）",
  "unit": "世帯",
  "category": "population",
  "source": {
    "kind": "estat",
    "statsDataId": "0003355488",
    "cdCat03": "0",
    "cdCat01": "0",
    "cdCat02": "00",
    "displayName": "年間収入階級別主世帯数（総数, 2018年）",
    "url": "https://www.e-stat.go.jp/dbview?sid=0003355488",
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
