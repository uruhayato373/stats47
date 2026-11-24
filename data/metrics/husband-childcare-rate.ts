import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const husbandChildcareRate: MetricConfig = {
  "key": "husband-childcare-rate",
  "title": "夫の育児参加率",
  "subtitle": "6歳未満の子がいる世帯で夫が育児をしている割合",
  "unit": "％",
  "category": "laborwage",
  "source": {
    "kind": "estat",
    "statsDataId": "0004008627",
    "cdCat01": "0",
    "cdCat03": "0",
    "cdCat04": "0",
    "cdCat05": "0",
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
