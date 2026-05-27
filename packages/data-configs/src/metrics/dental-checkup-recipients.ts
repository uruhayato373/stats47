import type { MetricConfig } from "../types";

export const dentalCheckupRecipients: MetricConfig = {
  "key": "dental-checkup-recipients",
  "title": "歯科健診・保健指導受診延人員（都道府県別・2020年度）",
  "unit": "人",
  "category": "socialsecurity",
  "source": {
    "kind": "estat",
    "statsDataId": "0004027738",
    "cdCat01": "100",
    "cdCat02": "140",
    "displayName": "歯科健診・保健指導受診延人員（都道府県別・2020年度）",
    "url": "https://www.e-stat.go.jp/dbview?sid=0004027738",
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
  "isFeatured": false,
  "featuredOrder": 0,
};
