import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const vacantHousingRateForRent: MetricConfig = {
  "key": "vacant-housing-rate-for-rent",
  "title": "賃貸用の空き家率",
  "description": "総住宅数に占める、賃貸用の空き家の割合。住宅・土地統計調査の「居住世帯の有無別住宅数」から、賃貸用の空き家の数を総住宅数で割って求めた。",
  "note": "住宅・土地統計調査は標本調査で、市区と人口1万5千人以上の町村だけを集計する。",
  "unit": "％",
  "category": "construction",
  "source": {
    "kind": "estat",
    "statsDataId": "0004021421",
    "cdTab": "01-2023",
    "axisRatio": {
      "axis": "cat01",
      "numeratorCodes": ["222"],
      "denominatorCodes": ["0"],
    },
    "displayName": "住宅・土地統計調査",
    "url": "https://www.e-stat.go.jp/dbview?sid=0004021421",
  },
  "citySource": {
    "kind": "estat",
    "statsDataId": "0004021421",
    "cdTab": "01-2023",
    "axisRatio": {
      "axis": "cat01",
      "numeratorCodes": ["222"],
      "denominatorCodes": ["0"],
    },
    "displayName": "住宅・土地統計調査",
    "url": "https://www.e-stat.go.jp/dbview?sid=0004021421",
  },
  "entities": [
    "city",
  ],
  "years": {
    "from": 2023,
    "to": 2023,
  },
  "yearFormat": "calendar",
  "visualization": {
    ...DEFAULT_METRIC_PRESENTATION,
    "colorScheme": "interpolateReds",
    "colorSchemeType": "sequential",
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
