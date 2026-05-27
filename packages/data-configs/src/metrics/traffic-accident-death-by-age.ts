import type { MetricConfig } from "../types";

export const trafficAccidentDeathByAge: MetricConfig = {
  "key": "traffic-accident-death-by-age",
  "title": "路上交通事故死亡数（傷害発生地・性年齢総数）",
  "unit": "人",
  "category": "safetyenvironment",
  "source": {
    "kind": "estat",
    "statsDataId": "0003411708",
    "cdCat01": "00100",
    "cdCat02": "00100",
    "displayName": "路上交通事故死亡数（傷害発生地・性年齢総数）",
    "url": "https://www.e-stat.go.jp/dbview?sid=0003411708",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2024,
    "to": 2024,
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
  "isFeatured": false,
  "featuredOrder": 0,
};
