import type { MetricConfig } from "../types";

export const retailSalesAreaByClass: MetricConfig = {
  "key": "retail-sales-area-by-class",
  "title": "小売業売場面積（経済センサス活動調査2021・小売計）",
  "unit": "m2",
  "category": "commercial",
  "source": {
    "kind": "estat",
    "statsDataId": "0004003261",
    "cdCat01": "I2",
    "cdCat02": "00",
    "displayName": "小売業売場面積（経済センサス活動調査2021・小売計）",
    "url": "https://www.e-stat.go.jp/dbview?sid=0004003261",
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
