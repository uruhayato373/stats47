import type { MetricConfig } from "../types";

export const inpatientRateByBedtype: MetricConfig = {
  "key": "inpatient-rate-by-bedtype",
  "title": "入院受療率（病床総数）（患者調査）",
  "subtitle": "病床別",
  "unit": "人口10万対",
  "category": "socialsecurity",
  "source": {
    "kind": "estat",
    "statsDataId": "0004002555",
    "cdCat01": "1",
    "cdCat02": "1",
    "displayName": "入院受療率（病床総数）（2020年患者調査）",
    "url": "https://www.e-stat.go.jp/dbview?sid=0004002555",
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
  "isFeatured": false,
  "featuredOrder": 0,
};
