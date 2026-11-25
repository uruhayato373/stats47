import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const buildingFireDamageAmountPerBuildingFire: MetricConfig = {
  "key": "building-fire-damage-amount-per-building-fire",
  "title": "建物火災損害額",
  "subtitle": "建物火災1件当たり",
  "unit": "万円",
  "category": "safetyenvironment",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010211",
    "cdCat01": "#K02306",
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
  },
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 1,
  },
  "calculation": {
    "isCalculated": false,
    "normalizationOptions": [
      {
        "type": "series",
        "metric": "building-fire-damage-amount-per-person",
        "label": "人口当たり",
      },
    ],
  },
  "groupKey": "building-fire-damage-amount-per-building-fire",
  "isActive": true,
};
