import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const seriousCrimePer100k: MetricConfig = {
  "key": "serious-crime-per-100k",
  "title": "凶悪犯認知件数",
  "description": "犯罪統計で凶悪犯に分類される事件を警察が認知した年間総件数。",
  "unit": "件",
  "denominator": "none",
  "category": "safetyenvironment",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010111",
    "cdCat01": "K420101",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 1975,
    "to": 2023,
  },
  "yearFormat": "calendar",
  "visualization": {
    ...DEFAULT_METRIC_PRESENTATION,
    "colorScheme": "interpolateReds",
    "colorSchemeType": "sequential",
    domain: { mode: "zero" },
  },
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 1,
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
