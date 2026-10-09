import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const pharmacyCountByPrefecture: MetricConfig = {
  "key": "pharmacy-count-by-prefecture",
  "title": "薬局数（都道府県別・総数）",
  "subtitle": "都道府県集計",
  "unit": "施設",
  "category": "socialsecurity",
  "source": {
    "kind": "estat",
    "statsDataId": "0004026870",
    "cdCat01": "100",
    "displayName": "薬局数（都道府県別・総数）",
    "url": "https://www.e-stat.go.jp/dbview?sid=0004026870",
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
