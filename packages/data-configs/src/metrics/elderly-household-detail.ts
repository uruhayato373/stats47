import type { MetricConfig } from "../types";

export const elderlyHouseholdDetail: MetricConfig = {
  "key": "elderly-household-detail",
  "title": "65歳以上世帯員のいる主世帯数（家族類型総数, 2018年）",
  "unit": "世帯",
  "category": "population",
  "source": {
    "kind": "estat",
    "statsDataId": "0003355281",
    "cdCat01": "0",
    "displayName": "65歳以上世帯員のいる主世帯数（家族類型総数, 2018年）",
    "url": "https://www.e-stat.go.jp/dbview?sid=0003355281",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2018,
    "to": 2018,
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
