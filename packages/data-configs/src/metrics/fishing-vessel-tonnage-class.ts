import type { MetricConfig } from "../types";

export const fishingVesselTonnageClass: MetricConfig = {
  "key": "fishing-vessel-tonnage-class",
  "title": "漁船・動力漁船隻数（トン数規模計, 2018年）",
  "subtitle": "※ 内陸 8 県 (栃木/群馬/埼玉/山梨/長野/岐阜/滋賀/奈良) は調査対象外 (value=0 で表示)",
  "unit": "隻",
  "category": "agriculture",
  "source": {
    "kind": "estat",
    "statsDataId": "0003262281",
    "cdCat01": "11",
    "displayName": "漁船・動力漁船隻数（トン数規模計, 2018年）",
    "url": "https://www.e-stat.go.jp/dbview?sid=0003262281",
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
