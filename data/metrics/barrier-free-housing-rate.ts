import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const barrierFreeHousingRate: MetricConfig = {
  "key": "barrier-free-housing-rate",
  "title": "バリアフリー化住宅率",
  "subtitle": "高齢者等のための設備がある住宅の割合",
  "unit": "％",
  "category": "construction",
  "source": {
    "kind": "estat",
    "statsDataId": "0004021599",
    "cdCat01": "0",
    "cdCat02": "0",
    "cdCat03": "0",
    "axisRatio": {
      "axis": "cat04",
      "numeratorCodes": ["1"],
      "denominatorCodes": ["0"],
    },
    "displayName": "住宅・土地統計調査",
    "url": "https://www.stat.go.jp/data/jyutaku/2023/index.html",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2023,
    "to": 2023,
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
