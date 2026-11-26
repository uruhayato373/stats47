import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const occupationalAccidentFrequencyRate: MetricConfig = {
  "key": "occupational-accident-frequency-rate",
  "title": "労働災害度数率",
  "subtitle": "100万延べ実労働時間あたりの労働災害死傷者数",
  "unit": "（件/百万時間）",
  "category": "laborwage",
  "source": {
    "kind": "estat",
    "statsDataId": "0003385946",
    "cdCat01": "100",
    "cdCat02": "S100",
    "displayName": "労働災害動向調査",
    "url": "https://www.mhlw.go.jp/toukei/list/89-1.html",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2015,
    "to": 2024,
  },
  "yearFormat": "calendar",
  "visualization": {
    ...DEFAULT_METRIC_PRESENTATION,
    "colorScheme": "interpolateBlues",
    "colorSchemeType": "sequential",
    domain: { mode: "zero" },
  },
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 2,
  },
  "calculation": {
    "isCalculated": false,
    "normalizationOptions": [
      {
        "denominator": { "kind": "population", "per": 100000 },
        "unit": "件/10万人",
        "decimalPlaces": 1,
      },
      {
        "denominator": { "kind": "area", "per": 100 },
        "unit": "件/100km²",
        "decimalPlaces": 2,
      },
    ],
  },
  "isActive": true,
};
