import type { MetricConfig } from "../types";

export const dentalHygienistByPrefecture: MetricConfig = {
  "key": "dental-hygienist-by-prefecture",
  "title": "歯科衛生士数（都道府県別）",
  "unit": "人",
  "category": "socialsecurity",
  "source": {
    "kind": "estat",
    "statsDataId": "0004027006",
    "cdTab": "0200",
    "displayName": "歯科衛生士数（都道府県別）",
    "url": "https://www.e-stat.go.jp/dbview?sid=0004027006",
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
