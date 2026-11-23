import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const gradeSeparatedPedestrianCrossingsPer1000Km: MetricConfig = {
  "key": "grade-separated-pedestrian-crossings-per-1000-km",
  "title": "立体横断施設数",
  "subtitle": "道路実延長千km当たり",
  "unit": "所",
  "category": "infrastructure",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010211",
    "cdCat01": "#K03102",
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
  "yearFormat": "fiscal",
  "visualization": {
    ...DEFAULT_METRIC_PRESENTATION,
    "colorScheme": "interpolateBlues",
    "colorSchemeType": "sequential",
  },
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 2,
  },
  "calculation": {
    "isCalculated": false,
  },
  "isActive": true,
};
