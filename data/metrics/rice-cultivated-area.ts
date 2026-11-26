import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const riceCultivatedArea: MetricConfig = {
  "key": "rice-cultivated-area",
  "title": "水稲作付面積",
  "subtitle": "水稲（子実用）の作付面積",
  "unit": "ha",
  "category": "agriculture",
  "source": {
    "kind": "estat",
    "statsDataId": "0003418934",
    "cdCat01": "100",
    "displayName": "作物統計調査",
    "url": "https://www.maff.go.jp/j/tokei/kouhyou/sakumotu/",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2019,
    "to": 2019,
  },
  "yearFormat": "calendar",
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
        "unit": "ha/10万人",
        "decimalPlaces": 1,
      },
      {
        "denominator": { "kind": "area", "per": 100 },
        "unit": "ha/100km²",
        "decimalPlaces": 2,
      },
    ],
  },
  "isActive": true,
};
