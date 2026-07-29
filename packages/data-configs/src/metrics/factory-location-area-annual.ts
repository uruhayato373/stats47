import type { MetricConfig } from "../types";

export const factoryLocationAreaAnnual: MetricConfig = {
  "key": "factory-location-area-annual",
  "title": "工場立地敷地面積（都道府県別・年次）",
  "unit": "千m2",
  "category": "construction",
  "source": {
    "kind": "estat",
    "statsDataId": "0003411431",
    "displayName": "工場立地敷地面積（都道府県別・年次）",
    "url": "https://www.e-stat.go.jp/dbview?sid=0003411431",
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
