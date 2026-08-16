import type { MetricConfig } from "../types";

export const fisheryWorkersCoastalOffshore: MetricConfig = {
  "key": "fishery-workers-coastal-offshore",
  "title": "沿岸・沖合・遠洋別漁業就業者数（計）",
  "note": "内陸県は調査対象外（0で表示）",
  "unit": "人",
  "category": "agriculture",
  "source": {
    "kind": "estat",
    "statsDataId": "0003262278",
    "cdCat01": "100",
    "displayName": "沿岸・沖合・遠洋別漁業就業者数（計）",
    "url": "https://www.e-stat.go.jp/dbview?sid=0003262278",
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
