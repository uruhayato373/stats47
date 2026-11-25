import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const utilitiesBudgetShareKakei: MetricConfig = {
  "key": "utilities-budget-share-kakei",
  "title": "消費支出に占める光熱・水道の割合",
  "note": "値は都道府県庁所在市（二人以上世帯）の用途分類による年平均1か月の割合で、県全体の値ではない。割合は同じ表の光熱・水道 ÷ 消費支出で、金額の多さそのものではない",
  "description": "家計調査の用途分類による年平均1か月の光熱・水道の支出が消費支出に占める割合。電気・ガス・他の光熱・上下水道料への支出。",
  "unit": "％",
  "category": "economy",
  "source": {
    "kind": "kakei-chousa",
    "filter": {
      "source": {
        "name": "家計調査",
        "url": "https://www.e-stat.go.jp/stat-search/files?page=1&layout=datalist&toukei=00200561",
      },
      "statsDataId": "0002070003",
      "cdCat02": "03",
      "axisRatio": {
        "axis": "cat01",
        "numeratorCodes": ["107"],
        "denominatorCodes": ["059"],
      },
    },
    "displayName": "家計調査",
    "url": "https://www.e-stat.go.jp/stat-search/files?page=1&layout=datalist&toukei=00200561",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2000,
    "to": 2025,
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
