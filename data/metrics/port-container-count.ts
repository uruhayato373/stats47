import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const portContainerCount: MetricConfig = {
  "key": "port-container-count",
  "title": "コンテナ取扱個数（港湾統計）",
  "unit": "TEU",
  "category": "infrastructure",
  "source": {
    "kind": "estat",
    "statsDataId": "0003130688",
    "cdCat01": "100",
    "cdCat02": "100",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2005,
    "to": 2023,
  },
  "yearFormat": "fiscal",
  "visualization": {
    ...DEFAULT_METRIC_PRESENTATION,
    "colorScheme": "interpolateBlues",
    "colorSchemeType": "sequential",
    domain: { mode: "zero" },
  },
  "display": {
    "conversionFactor": 0.0001,
    "decimalPlaces": 1,
    "displayUnit": "万TEU",
  },
  "calculation": {
    "isCalculated": false,
    "normalizationOptions": [
      {
        "denominator": { "kind": "population", "per": 100000 },
        "unit": "TEU/10万人",
        "decimalPlaces": 1,
      },
      {
        "denominator": { "kind": "area", "per": 100 },
        "unit": "TEU/100km²",
        "decimalPlaces": 2,
      },
    ],
  },
  "isActive": true,
};
