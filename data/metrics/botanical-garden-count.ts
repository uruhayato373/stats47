import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const botanicalGardenCount: MetricConfig = {
  "key": "botanical-garden-count",
  "title": "登録・相当植物園数",
  "subtitle": "登録博物館と博物館相当施設の合計（博物館類似施設を除く）",
  "unit": "館",
  "category": "educationsports",
  "source": {
    "kind": "estat",
    "statsDataId": "0003348770",
    "cdCat01": "00000800",
    "cdCat02": "182",
    "displayName": "社会教育調査",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2015,
    "to": 2015,
  },
  "yearFormat": "fiscal",
  "visualization": {
    ...DEFAULT_METRIC_PRESENTATION,
    "colorScheme": "interpolateGreens",
    "colorSchemeType": "sequential",
    domain: { mode: "zero" },
  },
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 0,
  },
  "calculation": {
    "isCalculated": false,
    "normalizationOptions": [
      {
        "denominator": { "kind": "population", "per": 100000 },
        "unit": "館/10万人",
        "decimalPlaces": 1,
      },
      {
        "denominator": { "kind": "area", "per": 100 },
        "unit": "館/100km²",
        "decimalPlaces": 2,
      },
    ],
  },
  "groupKey": "museum-type-count",
  "seoNote": "博物館類似施設は含みません。",
  "isActive": true,
};
