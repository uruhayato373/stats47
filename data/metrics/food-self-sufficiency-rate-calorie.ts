import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const foodSelfSufficiencyRateCalorie: MetricConfig = {
  "key": "food-self-sufficiency-rate-calorie",
  "title": "食料自給率（カロリーベース）",
  "unit": "％",
  "category": "agriculture",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010109",
    "cdCat01": "I3301",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm"
  },
  "entities": [
    "prefecture",
  ],
  "years": "all",
  "yearFormat": "fiscal",
  "visualization": {
    ...DEFAULT_METRIC_PRESENTATION,
    "colorScheme": "interpolateGreens",
    "colorSchemeType": "sequential",
  },
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 0
  },
  "calculation": {
    "isCalculated": false,
    "normalizationOptions": []
  },
  "isActive": true,
};
