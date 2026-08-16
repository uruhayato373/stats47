import type { MetricConfig } from "../types";

export const recreationalFishingCount: MetricConfig = {
  "key": "recreational-fishing-count",
  "title": "遊漁数（主とする遊漁場種類計）",
  "note": "内陸県は調査対象外（0で表示）",
  "unit": "100人",
  "category": "agriculture",
  "source": {
    "kind": "estat",
    "statsDataId": "0003262287",
    "cdCat01": "100",
    "displayName": "遊漁数（主とする遊漁場種類計）",
    "url": "https://www.e-stat.go.jp/dbview?sid=0003262287",
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
