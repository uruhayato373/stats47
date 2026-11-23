import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const convenienceStoreSalesMonthly: MetricConfig = {
  "key": "convenience-store-sales-monthly",
  "title": "コンビニエンスストア販売額（都道府県別・年計）",
  "subtitle": "月次",
  "unit": "百万円",
  "category": "commercial",
  "source": {
    "kind": "estat",
    "statsDataId": "0004032502",
    "cdCat01": "0101300",
    "cdCat02": "01040100",
    "cdCat03": "01030100",
    "timeScope": "annual",
    "displayName": "コンビニエンスストア販売額（都道府県別・年計）",
    "url": "https://www.e-stat.go.jp/dbview?sid=0004032502",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2022,
    "to": 2024,
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
