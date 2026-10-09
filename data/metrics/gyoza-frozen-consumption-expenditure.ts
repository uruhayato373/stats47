import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const gyozaFrozenConsumptionExpenditure: MetricConfig = {
  "key": "gyoza-frozen-consumption-expenditure",
  "title": "ぎょうざ消費支出額",
  "subtitle": "都道府県庁所在市の二人以上世帯の年間ぎょうざ消費支出額（冷凍品を除く）",
  "note": "家計調査の「ぎょうざ」は「他の調理食品」の一品目で、県庁所在市の二人以上世帯が購入したぎょうざ（生も含む）の支出額。冷凍品は別品目の「冷凍調理食品」、飲食店での食事は外食の別品目に入り、この値には含まれない（総務省 収支項目分類 2020年改定）。対象は県庁所在市のみで県全体の値ではない",
  "unit": "円",
  "category": "economy",
  "source": {
    "kind": "kakei-chousa",
    "filter": {
      "source": {
        "name": "家計調査",
        "url": "https://www.e-stat.go.jp/stat-search/files?page=1&layout=datalist&toukei=00200561",
      },
      "statsDataId": "0003348239",
      "cdCat01": "010920070",
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
    "to": 2024,
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
    "normalizationOptions": [
      {
        "type": "per_population",
        "label": "人口10万人あたり",
        "unit": "円/10万人",
        "scaleFactor": 100000,
        "decimalPlaces": 1,
      },
      {
        "type": "per_area",
        "label": "面積100km²あたり",
        "unit": "円/100km²",
        "scaleFactor": 100,
        "decimalPlaces": 2,
      },
    ],
    "isCalculated": false,
  },
  "seoTitle": "ぎょうざ消費支出額ランキング都道府県【2024年】｜1位宮崎県（3,517円）",
  "seoDescription": "2024年のぎょうざ消費支出額の都道府県別ランキング。1位宮崎県（3,517円）、最下位高知県（1,105円）で3.2倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
