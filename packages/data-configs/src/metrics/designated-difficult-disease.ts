import type { MetricConfig } from "../types";

export const designatedDifficultDisease: MetricConfig = {
  "key": "designated-difficult-disease",
  "title": "指定難病受給者証所持者数（都道府県別・疾患総数）",
  "unit": "人",
  "category": "socialsecurity",
  "source": {
    "kind": "estat",
    "statsDataId": "0004026904",
    "cdCat01": "100",
    "displayName": "指定難病受給者証所持者数（都道府県別・疾患総数）",
    "url": "https://www.e-stat.go.jp/dbview?sid=0004026904",
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
