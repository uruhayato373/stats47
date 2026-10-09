import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const threeGenerationHouseholdMembers: MetricConfig = {
  "key": "three-generation-household-members",
  "title": "3世代世帯人員",
  "unit": "人",
  "category": "population",
  "surveyId": "census",
  "source": {
    "kind": "estat",
    "statsDataId": "0003445285",
    "cdCat01": "R1",
    "displayName": "国勢調査",
    "url": "https://www.e-stat.go.jp/stat-search/files?page=1&toukei=00200521",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "years": [
      2020,
    ],
  },
  "yearFormat": "calendar",
  "visualization": {
    ...DEFAULT_METRIC_PRESENTATION,
    "colorScheme": "interpolateBlues",
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
        "type": "per_population",
        "label": "人口10万人あたり",
        "unit": "人/10万人",
        "scaleFactor": 100000,
        "decimalPlaces": 1,
      },
    ],
  },
  "isActive": true,
};
