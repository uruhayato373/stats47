import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const suicideRatePer100k: MetricConfig = {
  "key": "suicide-rate-per-100k",
  "title": "自殺率",
  "subtitle": "人口10万人当たり",
  "denominator": { "kind": "population", "per": 100000 },
  "unit": "人口10万対",
  "category": "safetyenvironment",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010109",
    "cdCat01": "I910803",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2009,
    "to": 2023,
  },
  "yearFormat": "calendar",
  "visualization": {
    ...DEFAULT_METRIC_PRESENTATION,
    "colorScheme": "interpolateBlues",
    "colorSchemeType": "sequential",
  },
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 1,
  },
  "calculation": {
    "isCalculated": false,
  },
  "isActive": true,
};
