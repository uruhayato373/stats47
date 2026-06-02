import type { MetricConfig } from "../types";

export const convenienceStoreSalesYoy: MetricConfig = {
  "key": "convenience-store-sales-yoy",
  "title": "コンビニエンスストア販売額（確報旧表）",
  "subtitle": "対前年比",
  "unit": "百万円",
  "category": "commercial",
  "source": {
    "kind": "estat",
    "statsDataId": "0003395254",
    "displayName": "コンビニエンスストア販売額（2019年・確報旧表）",
    "url": "https://www.e-stat.go.jp/dbview?sid=0003395254",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2019,
    "to": 2019,
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
