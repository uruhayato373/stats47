import type { MetricConfig } from "../types";

export const fishingVesselCrew: MetricConfig = {
  "key": "fishing-vessel-crew",
  "title": "漁船乗組員数（性別計・年齢計）",
  "note": "内陸県は調査対象外（0で表示）",
  "unit": "人",
  "category": "agriculture",
  "source": {
    "kind": "estat",
    "statsDataId": "0003262282",
    "cdCat01": "11",
    "cdCat02": "11",
    "displayName": "漁船乗組員数（性別計・年齢計）",
    "url": "https://www.e-stat.go.jp/dbview?sid=0003262282",
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
