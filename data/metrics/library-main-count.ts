import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const libraryMainCount: MetricConfig = {
  "key": "library-main-count",
  "title": "図書館本館数",
  "unit": "館",
  "category": "educationsports",
  "source": {
    "kind": "estat",
    "statsDataId": "0003348596",
    "cdCat01": "010",
    "cdCat02": "020",
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
    "colorScheme": "interpolatePurples",
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
  "groupKey": "education-facility-count",
  "isActive": true,
};
