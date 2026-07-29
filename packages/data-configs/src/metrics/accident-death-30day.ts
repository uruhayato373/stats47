import type { MetricConfig } from "../types";

export const accidentDeath30day: MetricConfig = {
  "key": "accident-death-30day",
  "title": "30日以内交通事故死者数（都道府県別）",
  "unit": "人",
  "category": "safetyenvironment",
  "source": {
    "kind": "estat",
    "statsDataId": "0003281586",
    "cdCat02": "110",
    "displayName": "30日以内交通事故死者数（都道府県別）",
    "url": "https://www.e-stat.go.jp/dbview?sid=0003281586",
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
