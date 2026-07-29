import type { MetricConfig } from "../types";

export const vegetableCultivationArea: MetricConfig = {
  "key": "vegetable-cultivation-area",
  "title": "野菜作付面積 都道府県別合計（だいこん）",
  "unit": "ha",
  "category": "agriculture",
  "source": {
    "kind": "estat",
    "statsDataId": "0003423836",
    "cdCat01": "001",
    "displayName": "野菜作付面積 都道府県別合計（だいこん, 2019年）",
    "url": "https://www.e-stat.go.jp/dbview?sid=0003423836",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2019,
    "to": 2019,
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
