import type { MetricConfig } from "../types";

export const mentalHealthApplication: MetricConfig = {
  "key": "mental-health-application",
  "title": "精神障害者申請通報届出件数（都道府県別・総数）",
  "unit": "件",
  "category": "socialsecurity",
  "source": {
    "kind": "estat",
    "statsDataId": "0004026960",
    "cdCat01": "100",
    "cdCat02": "100",
    "displayName": "精神障害者申請通報届出件数（都道府県別・総数）",
    "url": "https://www.e-stat.go.jp/dbview?sid=0004026960",
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
