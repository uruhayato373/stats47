import type { MetricConfig } from "../types";

export const generalProjectInvestmentRailway: MetricConfig = {
  "key": "general-project-investment-railway",
  "title": "一般事業投資額",
  "subtitle": "鉄道",
  "unit": "千円",
  "category": "tourism",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010104",
    "cdCat01": "D5211",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 1976,
    "to": 2006,
  },
  "yearExclusions": [
    {
      "years": [
        1975,
      ],
      "reason": "2026-10 の移行時に当時の years から引き継いだ除外 (まだ判断していない。根拠が無ければ外して年を戻す)",
    },
  ],
  "yearFormat": "fiscal",
  "visualization": {
    "colorScheme": "interpolateBlues",
    "colorSchemeType": "sequential",
    "minValueType": "data-min",
  },
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 0,
  },
  "calculation": {
    "isCalculated": false,
  },
  "isActive": true,
};
