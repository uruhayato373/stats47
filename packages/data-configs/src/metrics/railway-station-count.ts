import type { MetricConfig } from "../types";

export const railwayStationCount: MetricConfig = {
  "key": "railway-station-count",
  "title": "鉄道駅数",
  "unit": "駅",
  "category": "infrastructure",
  "source": {
    "kind": "external",
    "fetcherKey": "mlit_ksj",
    "config": {
      "source": {
        "name": "国土数値情報",
        "url": "https://nlftp.mlit.go.jp/ksj/index.html",
      },
      "ksjDataId": "N02",
      "ksjVersion": "24",
      "description": "国土数値情報に登録されている鉄道駅の都道府県別数",
    },
    "displayName": "国土数値情報",
    "url": "https://nlftp.mlit.go.jp/ksj/index.html",
  },
  "surveyId": "mlit-ksj",
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2024,
    "to": 2024,
  },
  "yearFormat": "calendar",
  "calculation": {
    "normalizationOptions": [
      {
        "type": "per_population",
        "label": "人口10万人あたり",
        "unit": "駅/10万人",
        "scaleFactor": 100000,
        "decimalPlaces": 1,
      },
      {
        "type": "per_area",
        "label": "面積100km²あたり",
        "unit": "駅/100km²",
        "scaleFactor": 100,
        "decimalPlaces": 2,
      },
    ],
    "isCalculated": false,
  },
  // 2026-08-17: 県の帰属を最寄り県庁所在地から属性/空間結合へ是正し値が変わった
  // (KSJ-PREF-ASSIGN-01)。
  "seoTitle": "鉄道駅数ランキング都道府県【2024年】｜1位東京都（892駅）",
  "seoDescription": "2024年の鉄道駅数の都道府県別ランキング。1位東京都（892駅）、最下位沖縄県（19駅）で46.9倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
