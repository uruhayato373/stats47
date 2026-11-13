import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const otherClothingMiscConsumptionExpenditure: MetricConfig = {
  "key": "other-clothing-misc-consumption-expenditure",
  "title": "他の被服のその他消費支出額",
  "subtitle": "2020年改定の品目分類",
  "note": "値は都道府県庁所在市（二人以上世帯）の年間値で、県全体の値ではない。2025年1月の品目分類改定でネクタイ・ストッキングなどを含む範囲に広がったため、2024年までのこの指標と2025年以降の値は接続しない (この指標は2024年まで)",
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
      "cdCat01": "050600090",
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
    "isCalculated": false,
  },
  "seoTitle": "他の被服のその他消費支出額ランキング都道府県【2024年】｜1位奈良県（3,909円）",
  "seoDescription": "2024年の他の被服のその他消費支出額の都道府県別ランキング。1位奈良県（3,909円）、最下位青森県（1,251円）で3.1倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
