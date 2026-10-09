import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const tertiaryActivityAvgTimeUnemployedMale: MetricConfig = {
  "key": "tertiary-activity-avg-time-unemployed-male",
  "title": "3次活動の平均時間",
  "subtitle": "男性・非有業者",
  "unit": "分",
  "category": "laborwage",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010213",
    "cdCat01": "#M0130107",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "years": [
      1976,
      1981,
      1986,
      1991,
      1996,
      2001,
      2006,
      2011,
      2016,
      2021,
    ],
  },
  "yearFormat": "calendar",
  "visualization": {
    ...DEFAULT_METRIC_PRESENTATION,
    "colorScheme": "interpolateBlues",
    "colorSchemeType": "sequential",
    "isReversed": false,
  },
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 0,
  },
  "calculation": {
    "isCalculated": false,
  },
  "seoTitle": "3次活動の平均時間（無業者・男）",
  "isActive": true,
};
