import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const newHireCount: MetricConfig = {
  "key": "new-hire-count",
  "title": "入職者数",
  "unit": "千人",
  "category": "laborwage",
  "source": {
    "kind": "estat",
    "statsDataId": "0003376330",
    "cdCat01": "S100",
    "cdCat02": "100",
    "displayName": "雇用動向調査",
    "url": "https://www.mhlw.go.jp/toukei/list/9-23-1.html",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2014,
    "to": 2021,
  },
  "yearFormat": "calendar",
  "visualization": {
    ...DEFAULT_METRIC_PRESENTATION,
    "colorScheme": "interpolateBlues",
    "colorSchemeType": "sequential",
    domain: { mode: "zero" },
  },
  "display": {
    "conversionFactor": 0.1,
    "decimalPlaces": 1,
    "displayUnit": "万人",
  },
  "calculation": {
    "isCalculated": false,
    "normalizationOptions": [
      {
        "denominator": { "kind": "population", "per": 100000 },
        "unit": "千人/10万人",
        "decimalPlaces": 1,
      },
      {
        "denominator": { "kind": "area", "per": 100 },
        "unit": "千人/100km²",
        "decimalPlaces": 2,
      },
    ],
  },
  "groupKey": "labor-mobility",
  "isActive": true,
};
