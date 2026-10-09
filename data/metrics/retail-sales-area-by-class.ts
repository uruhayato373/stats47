import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const retailSalesAreaByClass: MetricConfig = {
  "key": "retail-sales-area-by-class",
  "title": "小売業売場面積（経済センサス活動調査・小売計）",
  "unit": "m2",
  "category": "commercial",
  "source": {
    "kind": "estat",
    "statsDataId": "0004003261",
    "cdTab": "704-2021",
    "cdCat01": "I2",
    "cdCat02": "00",
    "displayName": "小売業売場面積（経済センサス活動調査2021・小売計）",
    "url": "https://www.e-stat.go.jp/dbview?sid=0004003261",
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
    ...DEFAULT_METRIC_PRESENTATION,
    "colorScheme": "interpolateBlues",
    "colorSchemeType": "sequential",
    domain: { mode: "zero" },
  },
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 1,
  },
  "isActive": true,
};
