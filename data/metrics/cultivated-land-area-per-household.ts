import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const cultivatedLandAreaPerHousehold: MetricConfig = {
  "key": "cultivated-land-area-per-household",
  "title": "耕地面積",
  "subtitle": "農家1戸当たり",
  "denominator": { "kind": "other", "per": 1, "scope": "農家", "counter": "戸" },
  "unit": "ｍ2",
  "category": "agriculture",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010203",
    "cdCat01": "#C0410701",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 1976,
    "to": 2024,
  },
  "yearFormat": "fiscal",
  "visualization": {
    ...DEFAULT_METRIC_PRESENTATION,
    "colorScheme": "interpolateGreens",
    "colorSchemeType": "sequential",
  },
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 1,
  },
  "calculation": {
    "isCalculated": false,
  },
  "groupKey": "cultivated-area",
  "isActive": true,
};
