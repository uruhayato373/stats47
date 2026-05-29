import type { MetricConfig } from "../types";

export const hobbyActivitySingleperson: MetricConfig = {
  "key": "hobby-activity-singleperson",
  "title": "趣味・娯楽の行動者数（単身世帯主・男女計・総数・全年齢, 2021年）",
  "unit": "千人",
  "category": "educationsports",
  "source": {
    "kind": "estat",
    "statsDataId": "0003455926",
    "cdCat01": "0",
    "cdCat02": "0",
    "displayName": "趣味・娯楽の行動者数（単身世帯主・男女計・総数・全年齢, 2021年）",
    "url": "https://www.e-stat.go.jp/dbview?sid=0003455926",
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
