import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const frequencyOfOccupationalAccidents: MetricConfig = {
  "key": "frequency-of-occupational-accidents",
  "title": "労働災害発生の頻度",
  "unit": "（件/百万時間）",
  "category": "safetyenvironment",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010206",
    "cdCat01": "#F08201",
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
    "colorScheme": "interpolateReds",
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
