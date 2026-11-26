import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const portVehicleFerry: MetricConfig = {
  "key": "port-vehicle-ferry",
  "title": "自動車航送車両台数（港湾統計）",
  "unit": "台",
  "category": "infrastructure",
  "source": {
    "kind": "estat",
    "statsDataId": "0003130796",
    "cdCat01": "100",
    "cdCat02": "100",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2009,
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
    "displayUnit": "万台",
  },
  "calculation": {
    "isCalculated": false,
    "normalizationOptions": [
      {
        "denominator": { "kind": "population", "per": 100000 },
        "unit": "台/10万人",
        "decimalPlaces": 1,
      },
      {
        "denominator": { "kind": "area", "per": 100 },
        "unit": "台/100km²",
        "decimalPlaces": 2,
      },
    ],
  },
  "isActive": true,
};
