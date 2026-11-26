import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const convenienceStoreCountCommercial: MetricConfig = {
  "key": "convenience-store-count-commercial",
  "title": "コンビニエンスストア店舗数",
  "unit": "店",
  "category": "commercial",
  "source": {
    "kind": "estat",
    "statsDataId": "0004032502",
    "cdCat01": "0105200",
    "cdCat02": "01040200",
    "cdCat03": "01030100",
    "timeScope": "annual",
    "displayName": "商業動態統計調査",
    "url": "https://www.meti.go.jp/statistics/tyo/syoudou/",
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
        "unit": "店/10万人",
        "decimalPlaces": 1,
      },
      {
        "denominator": { "kind": "area", "per": 100 },
        "unit": "店/100km²",
        "decimalPlaces": 2,
      },
    ],
  },
  "groupKey": "convenience-store-count",
  "isActive": true,
};
