import type { MetricConfig } from "../types";

export const retailEstablishmentsByPrefecture: MetricConfig = {
  "key": "retail-establishments-by-prefecture",
  "title": "小売業事業所数（経済センサス活動調査2021）",
  "unit": "事業所",
  "category": "commercial",
  "source": {
    "kind": "estat",
    "statsDataId": "0004003256",
    "cdCat01": "9",
    "cdCat02": "I2",
    "displayName": "小売業事業所数（経済センサス活動調査2021）",
    "url": "https://www.e-stat.go.jp/dbview?sid=0004003256",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2021,
    "to": 2021,
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
