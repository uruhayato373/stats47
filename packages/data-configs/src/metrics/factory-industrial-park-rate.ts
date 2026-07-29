import type { MetricConfig } from "../types";

export const factoryIndustrialParkRate: MetricConfig = {
  "key": "factory-industrial-park-rate",
  "title": "工業団地内立地率（都道府県別）",
  "unit": "%",
  "category": "construction",
  "source": {
    "kind": "estat",
    "statsDataId": "0003411445",
    "displayName": "工業団地内立地率（都道府県別）",
    "url": "https://www.e-stat.go.jp/dbview?sid=0003411445",
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
