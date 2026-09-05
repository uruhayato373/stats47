import type { MetricConfig } from "../types";

export const damCount: MetricConfig = {
  "key": "dam-count",
  "title": "ダム数",
  "unit": "か所",
  "category": "infrastructure",
  "source": {
    "kind": "external",
    "fetcherKey": "mlit_ksj",
    "config": {
      "source": {
        "name": "国土数値情報",
        "url": "https://nlftp.mlit.go.jp/ksj/index.html",
      },
      "ksjDataId": "W01",
      "ksjVersion": "14",
      "description": "国土数値情報に登録されているダムの都道府県別数",
    },
    "displayName": "国土数値情報",
    "url": "https://nlftp.mlit.go.jp/ksj/index.html",
  },
  "surveyId": "mlit-ksj",
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2014,
    "to": 2014,
  },
  "yearFormat": "calendar",
  "calculation": {
    "normalizationOptions": [
      {
        "type": "per_population",
        "label": "人口10万人あたり",
        "unit": "か所/10万人",
        "scaleFactor": 100000,
        "decimalPlaces": 1,
      },
      {
        "type": "per_area",
        "label": "面積100km²あたり",
        "unit": "か所/100km²",
        "scaleFactor": 100,
        "decimalPlaces": 2,
      },
    ],
    "isCalculated": false,
  },
  // 2026-08-17: 県の帰属を最寄り県庁所在地から属性/空間結合へ是正し値が変わった
  // (KSJ-PREF-ASSIGN-01)。
  "seoTitle": "ダム数ランキング都道府県｜なぜ北海道が190か所で突出?【2014】",
  "seoDescription": "ダムの数は都道府県で大きく偏ります──1位北海道190か所に対し、最下位は東京都の8か所。地形・河川・電力需要が決める分布の理由を47都道府県の2014年データで解説します。",
  "isActive": false,
};
