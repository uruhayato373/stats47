import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const floodAffectedRivers: MetricConfig = {
  "key": "flood-affected-rivers",
  "title": "水害被災河川・海岸数（一般資産等）",
  "unit": "延数",
  "category": "safetyenvironment",
  "source": {
    "kind": "estat",
    "statsDataId": "0003155647",
    "cdCat01": "800",
    "displayName": "水害統計調査",
    "url": "https://www.mlit.go.jp/river/toukei_chousa/kasen/suigaitoukei/index.html",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "years": [
      2006,
      2008,
      2011,
      2012,
      2014,
    ],
  },
  "yearFormat": "fiscal",
  "visualization": {
    ...DEFAULT_METRIC_PRESENTATION,
    "colorScheme": "interpolateReds",
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
        "unit": "延数/10万人",
        "decimalPlaces": 1,
      },
      {
        "denominator": { "kind": "area", "per": 100 },
        "unit": "延数/100km²",
        "decimalPlaces": 2,
      },
    ],
  },
  "isActive": true,
};
