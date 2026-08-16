import type { MetricConfig } from "../types";

export const fishingVesselTonnageClass: MetricConfig = {
  "key": "fishing-vessel-tonnage-class",
  "title": "漁船・動力漁船隻数（トン数規模計）",
  "note": "内陸県は調査対象外（0で表示）",
  "unit": "隻",
  "category": "agriculture",
  "source": {
    "kind": "estat",
    "statsDataId": "0003262281",
    "cdCat01": "11",
    "displayName": "漁船・動力漁船隻数（トン数規模計）",
    "url": "https://www.e-stat.go.jp/dbview?sid=0003262281",
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
