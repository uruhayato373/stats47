import type { MetricConfig } from "../types";

export const portEntryVesselCount: MetricConfig = {
  "key": "port-entry-vessel-count",
  "title": "漁港入港利用実漁船隻数（計）",
  "note": "内陸県は調査対象外（0で表示）",
  "unit": "隻",
  "category": "agriculture",
  "source": {
    "kind": "estat",
    "statsDataId": "0003262295",
    "cdCat01": "100",
    "displayName": "漁港入港利用実漁船隻数（計）",
    "url": "https://www.e-stat.go.jp/dbview?sid=0003262295",
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
