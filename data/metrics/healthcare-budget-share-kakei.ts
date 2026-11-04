import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const healthcareBudgetShareKakei: MetricConfig = {
  "key": "healthcare-budget-share-kakei",
  "title": "消費支出に占める保健医療の割合",
  "subtitle": "都道府県庁所在市の二人以上世帯の消費支出に占める保健医療の割合（用途分類の年平均1か月）",
  "note": "県全体の値ではなく県庁所在市の値。割合は同じ表の保健医療 ÷ 消費支出で、金額の多さそのものではない",
  "description": "家計調査の用途分類による保健医療の支出が消費支出に占める割合。医薬品・保健医療サービスなどへの支出。",
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
        "numeratorCodes": ["140"],
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
    "from": 2007,
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
  "isActive": false,
};
