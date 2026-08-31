import type { MetricConfig } from "../types";

export const lakeCount: MetricConfig = {
  "key": "lake-count",
  "title": "湖沼数",
  "unit": "か所",
  "category": "landweather",
  "source": {
    "kind": "external",
    "fetcherKey": "mlit_ksj",
    "config": {
      "source": {
        "name": "国土数値情報",
        "url": "https://nlftp.mlit.go.jp/ksj/index.html",
      },
      "ksjDataId": "W09",
      "ksjVersion": "05",
      "description": "国土数値情報に登録されている湖沼の都道府県別数",
    },
    "displayName": "国土数値情報",
    "url": "https://nlftp.mlit.go.jp/ksj/index.html",
  },
  "surveyId": "mlit-ksj",
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2005,
    "to": 2005,
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
  "seoTitle": "湖沼数ランキング都道府県【2005年】｜1位北海道（107か所）",
  "seoDescription": "2005年の湖沼数の都道府県別ランキング。1位北海道（107か所）、最下位大阪府（0か所）で地図やグラフで47都道府県を比較。",
  "isActive": true,
};
