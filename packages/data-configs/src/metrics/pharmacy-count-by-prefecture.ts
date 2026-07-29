import type { MetricConfig } from "../types";

export const pharmacyCountByPrefecture: MetricConfig = {
  "key": "pharmacy-count-by-prefecture",
  "title": "薬局数（都道府県別・総数）",
  "subtitle": "都道府県集計",
  "unit": "施設",
  "category": "socialsecurity",
  "source": {
    "kind": "estat",
    "statsDataId": "0004026870",
    "cdCat01": "100",
    "displayName": "薬局数（都道府県別・総数）",
    "url": "https://www.e-stat.go.jp/dbview?sid=0004026870",
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
