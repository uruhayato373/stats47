import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const consumerPriceDifferenceIndexUtilities: MetricConfig = {
  "key": "consumer-price-difference-index-utilities",
  "title": "消費者物価地域差指数",
  "subtitle": "光熱・水道",
  "description": "全国平均の光熱・水道価格水準を100とし、都道府県ごとの同費目の物価水準を比較した年平均指数です。",
  "unit": "（全国=100）",
  "category": "economy",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010212",
    "cdCat01": "#L04418",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2013,
    "to": 2025,
  },
  "supplementalSources": [
    {
      "years": [2025],
      "source": {
        "kind": "estat",
        "statsDataId": "0003441258",
        "cdTab": "40",
        "cdCat01": "00040",
        "displayName": "小売物価統計調査（構造編）",
        "url": "https://www.e-stat.go.jp/dbview?sid=0003441258",
      },
      "reason": "社会・人口統計体系に2025年の物価地域差指数（2026-09-18公表）が未反映のため、小売物価統計調査（構造編）の表から直接取る。2013〜2024年は47都道府県×12費目の全セルが社会・人口統計体系の値と一致することを確認済み (2026-10-08)",
    },
  ],
  "yearFormat": "calendar",
  "visualization": {
    ...DEFAULT_METRIC_PRESENTATION,
    "colorScheme": "interpolateRdBu",
    "colorSchemeType": "diverging",
    "divergingMidpoint": "custom",
    "divergingMidpointValue": 100,
    "isReversed": false,
    "isSymmetrized": false,
  },
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 1,
  },
  "calculation": {
    "isCalculated": false,
  },
  "seoTitle": "消費者物価地域差指数（光熱・水道）",
  "isActive": true,
};
