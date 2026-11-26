import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const femaleScheduledEarnings: MetricConfig = {
  "key": "female-scheduled-earnings",
  "title": "女性所定内給与額",
  "subtitle": "月額",
  "unit": "千円",
  "category": "laborwage",
  "source": {
    "kind": "estat",
    "statsDataId": "0003426933",
    "cdTab": "10",
    "cdCat03": "01",
    "cdCat04": "01",
    "cdCat01": "03",
    "cdCat02": "01",
    "displayName": "賃金構造基本統計調査",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2021,
    "to": 2022,
  },
  "yearFormat": "calendar",
  "visualization": {
    ...DEFAULT_METRIC_PRESENTATION,
    "colorScheme": "interpolateReds",
    "colorSchemeType": "sequential",
    domain: { mode: "zero" },
  },
  "display": {
    "conversionFactor": 0.1,
    "decimalPlaces": 1,
    "displayUnit": "万円",
  },
  "calculation": {
    "isCalculated": false,
    "normalizationOptions": [
      {
        "denominator": { "kind": "population", "per": 100000 },
        "unit": "千円/10万人",
        "decimalPlaces": 1,
      },
      {
        "denominator": { "kind": "area", "per": 100 },
        "unit": "千円/100km²",
        "decimalPlaces": 2,
      },
    ],
  },
  "groupKey": "gender-wage",
  "isActive": true,
};
