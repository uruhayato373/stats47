import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const solarPanelHousingRate: MetricConfig = {
  "key": "solar-panel-housing-rate",
  "title": "太陽光発電機のある住宅率",
  "subtitle": "太陽光を利用した発電機器がある住宅の割合",
  "unit": "％",
  "category": "construction",
  "source": {
    "kind": "estat",
    "statsDataId": "0004021642",
    "cdCat01": "0",
    "cdCat02": "0",
    "cdCat03": "0",
    "cdCat04": "0",
    "axisRatio": {
      "axis": "cat05",
      "numeratorCodes": ["21"],
      "denominatorCodes": ["21", "22"],
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
