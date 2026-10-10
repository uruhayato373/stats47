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
    "from": 1994,
    "to": 2022,
  },
  "yearExclusions": [
    {
      "years": [
        1975,
        1976,
        1977,
        1978,
        1979,
        1980,
        1981,
        1982,
        1983,
        1984,
        1985,
        1986,
        1987,
        1988,
        1989,
        1990,
        1991,
        1992,
        1993,
      ],
      "reason": "2026-10 の移行時に当時の years から引き継いだ除外 (まだ判断していない。根拠が無ければ外して年を戻す)",
    },
  ],
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
