import type { MetricConfig } from "../types";

export const midwifeByPrefecture: MetricConfig = {
  "key": "midwife-by-prefecture",
  "title": "就業助産師数（都道府県別・総数）",
  "unit": "人",
  "category": "socialsecurity",
  "source": {
    "kind": "estat",
    "statsDataId": "0004026929",
    "cdTab": "0260",
    "cdCat01": "100",
    "displayName": "就業助産師数（都道府県別・総数）",
    "url": "https://www.e-stat.go.jp/dbview?sid=0004026929",
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
