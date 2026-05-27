import type { MetricConfig } from "../types";

export const hospitalStaffByOccupation: MetricConfig = {
  "key": "hospital-staff-by-occupation",
  "title": "保健所常勤職員数（総数）（2020年度地域保健事業報告）",
  "unit": "人",
  "category": "socialsecurity",
  "source": {
    "kind": "estat",
    "statsDataId": "0004027744",
    "cdCat01": "100",
    "displayName": "保健所常勤職員数（総数）（2020年度地域保健事業報告）",
    "url": "https://www.e-stat.go.jp/dbview?sid=0004027744",
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
