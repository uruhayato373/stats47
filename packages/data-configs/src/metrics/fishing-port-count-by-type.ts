import type { MetricConfig } from "../types";

export const fishingPortCountByType: MetricConfig = {
  "key": "fishing-port-count-by-type",
  "title": "漁港数（漁港種類計）",
  "subtitle": "種類別",
  "note": "内陸県は調査対象外（0で表示）",
  "unit": "港",
  "category": "agriculture",
  "source": {
    "kind": "estat",
    "statsDataId": "0003262291",
    "cdCat01": "100",
    "displayName": "漁港数（漁港種類計）",
    "url": "https://www.e-stat.go.jp/dbview?sid=0003262291",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2003,
    "to": 2003,
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
