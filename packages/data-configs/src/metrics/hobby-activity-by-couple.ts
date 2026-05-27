import type { MetricConfig } from "../types";

export const hobbyActivityByCouple: MetricConfig = {
  "key": "hobby-activity-by-couple",
  "title": "共働き世帯の夫の趣味・娯楽行動者推定人口",
  "unit": "千人",
  "category": "educationsports",
  "source": {
    "kind": "estat",
    "statsDataId": "0003455918",
    "cdCat01": "1",
    "cdCat02": "1",
    "displayName": "共働き世帯の夫の趣味・娯楽行動者推定人口",
    "url": "https://www.e-stat.go.jp/dbview?sid=0003455918",
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
