import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const sideJobRate: MetricConfig = {
  "key": "side-job-rate",
  "title": "副業率",
  "subtitle": "有業者のうち副業がある人の割合",
  "unit": "％",
  "category": "laborwage",
  "source": {
    "kind": "estat",
    "statsDataId": "0004008468",
    "cdCat01": "0",
    "cdCat03": "0",
    "cdCat04": "00",
    "cdCat05": "00",
    "axisRatio": {
      "axis": "cat02",
      "numeratorCodes": ["1"],
      "denominatorCodes": ["0"],
    },
    "displayName": "就業構造基本調査",
    "url": "https://www.stat.go.jp/data/shugyou/2022/index.html",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2022,
    "to": 2022,
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
    "decimalPlaces": 1,
  },
  "calculation": {
    "isCalculated": false,
  },
  "isActive": true,
};
