import type { MetricConfig } from "../types";

export const smartphoneUsageStudents: MetricConfig = {
  "key": "smartphone-usage-students",
  "title": "在学者（10歳以上）の学業総平均時間（週全体・スマホ使用者・総数）",
  "unit": "分",
  "category": "educationsports",
  "source": {
    "kind": "estat",
    "statsDataId": "0003457319",
    "cdCat03": "0",
    "cdCat04": "0",
    "cdCat05": "06",
    "cdCat01": "1",
    "cdCat02": "0",
    "displayName": "在学者（10歳以上）の学業総平均時間（週全体・スマホ使用者・総数）",
    "url": "https://www.e-stat.go.jp/dbview?sid=0003457319",
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
};
