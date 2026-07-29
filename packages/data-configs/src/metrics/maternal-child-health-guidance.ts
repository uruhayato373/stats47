import type { MetricConfig } from "../types";

export const maternalChildHealthGuidance: MetricConfig = {
  "key": "maternal-child-health-guidance",
  "title": "妊産婦・乳幼児保健指導延人員（都道府県別）",
  "unit": "人",
  "category": "socialsecurity",
  "source": {
    "kind": "estat",
    "statsDataId": "0004027833",
    "cdCat01": "100",
    "cdCat02": "100",
    "displayName": "妊産婦・乳幼児保健指導延人員（都道府県別・2020年度）",
    "url": "https://www.e-stat.go.jp/dbview?sid=0004027833",
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
    "decimalPlaces": 0,
  },
  "isActive": true,
};
