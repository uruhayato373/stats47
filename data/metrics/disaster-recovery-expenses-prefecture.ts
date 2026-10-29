import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const disasterRecoveryExpensesPrefecture: MetricConfig = {
  "key": "disaster-recovery-expenses-prefecture",
  "title": "災害復旧費",
  "subtitle": "都道府県財政",
  "unit": "千円",
  "category": "safetyenvironment",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010104",
    "cdCat01": "D310312",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 1975,
    "to": 2022,
  },
  "yearFormat": "fiscal",
  "visualization": {
    ...DEFAULT_METRIC_PRESENTATION,
    "colorScheme": "interpolateBlues",
    "colorSchemeType": "sequential",
  },
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 0,
  },
  "calculation": {
    "isCalculated": false,
  },
  "groupKey": "disaster-recovery-expenses-prefecture",
  "isActive": true,
};
