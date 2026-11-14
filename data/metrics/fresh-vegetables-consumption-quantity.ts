import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const freshVegetablesConsumptionQuantity: MetricConfig = {
  "key": "fresh-vegetables-consumption-quantity",
  "title": "生鮮野菜消費量",
  "subtitle": "合計",
  "note": "値は都道府県庁所在市（二人以上世帯）の年間値で、県全体の値ではない。品目別の購入数量を足し上げた値で、乾物・海藻・漬物などの加工品は含まない。",
  "description": "家計調査（二人以上の世帯）の生鮮野菜 29 品目（葉茎菜・根菜・果菜・きのこ類・他の野菜）の年間購入数量を合算した値。",
  "unit": "g",
  "category": "economy",
  "source": {
    "kind": "kakei-chousa",
    "filter": {
      "source": {
        "name": "家計調査",
        "url": "https://www.e-stat.go.jp/stat-search/files?page=1&layout=datalist&toukei=00200561",
      },
      "statsDataId": "0004023606",
      // 29 品目を合算 (家計調査の数量表に当該中分類の総数コードは無い。全品目は同じ数量表で既存 metric が取り込み済み)
      "axisSum": {
        "axis": "cat01",
        "codes": ["010511010", "010511020", "010511030", "010511040", "010511050", "010511060", "010511070", "010511080", "010512010", "010512020", "010512030", "010512040", "010512050", "010512060", "010512070", "010512080", "010512090", "010512100", "010513010", "010513020", "010513030", "010513040", "010513050", "010513060", "010513070", "010513080", "010513090", "010513100", "010513110"],
      },
      "cdCat02": "03",
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
    "colorScheme": "interpolateGreens",
    "colorSchemeType": "sequential",
    domain: { mode: "zero" },
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
