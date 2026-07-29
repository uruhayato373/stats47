import type { MetricConfig } from "../types";

export const foodSanitationInspection: MetricConfig = {
  "key": "food-sanitation-inspection",
  "title": "食品収去試験数（都道府県別）",
  "unit": "点",
  "category": "socialsecurity",
  "source": {
    "kind": "estat",
    "statsDataId": "0004026844",
    "displayName": "食品収去試験数（都道府県別）",
    "url": "https://www.e-stat.go.jp/dbview?sid=0004026844",
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
    "minValueType": "zero",
  },
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 1,
  },
  "isActive": true,
};
