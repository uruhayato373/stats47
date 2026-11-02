import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const householdSavingsBalance: MetricConfig = {
  "key": "household-savings-balance",
  "title": "貯蓄現在高",
  "subtitle": "都道府県庁所在市の二人以上世帯の1世帯当たりの貯蓄現在高",
  "note": "家計調査の貯蓄・負債編 (二人以上の世帯) の県庁所在市の値で、県全体の値ではない。平均値なので一部の高額世帯に引っ張られる。全国消費実態調査・全国家計構造調査の貯蓄現在高とは別系列",
  "unit": "万円",
  "category": "economy",
  "source": {
    "kind": "kakei-chousa",
    "filter": {
      "source": {
        "name": "家計調査",
        "url": "https://www.e-stat.go.jp/stat-search/files?page=1&layout=datalist&toukei=00200561",
      },
      "statsDataId": "0002210008",
      "cdCat01": "012",
      "cdCat02": "03",
    },
    "displayName": "家計調査",
    "url": "https://www.e-stat.go.jp/stat-search/files?page=1&layout=datalist&toukei=00200561",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2002,
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
    "decimalPlaces": 0,
  },
  "calculation": {
    "isCalculated": false,
  },
  "seoTitle": "貯蓄現在高ランキング｜県庁所在市の二人以上世帯",
  "seoDescription": "家計調査 (貯蓄・負債編) の二人以上世帯について、県庁所在市ごとの 1 世帯当たり貯蓄現在高を比較。預貯金・生命保険・有価証券などの合計です。",
  "isActive": true,
};
