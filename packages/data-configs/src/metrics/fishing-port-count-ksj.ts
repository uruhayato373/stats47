import type { MetricConfig } from "../types";

export const fishingPortCountKsj: MetricConfig = {
  "key": "fishing-port-count-ksj",
  "title": "漁港数",
  "subtitle": "総数（国土数値情報）",
  "unit": "港",
  "category": "agriculture",
  "source": {
    "kind": "external",
    "fetcherKey": "mlit_ksj",
    "config": {
      "source": {
        "name": "国土数値情報",
        "url": "https://nlftp.mlit.go.jp/ksj/index.html",
      },
      "ksjDataId": "C09",
      "ksjVersion": "06",
      "description": "国土数値情報に登録されている漁港の都道府県別数",
    },
    "displayName": "国土数値情報",
    "url": "https://nlftp.mlit.go.jp/ksj/index.html",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2006,
    "to": 2006,
  },
  "yearFormat": "calendar",
  "calculation": {
    "normalizationOptions": [
      {
        "type": "per_population",
        "label": "人口10万人あたり",
        "unit": "港/10万人",
        "scaleFactor": 100000,
        "decimalPlaces": 1,
      },
      {
        "type": "per_area",
        "label": "面積100km²あたり",
        "unit": "港/100km²",
        "scaleFactor": 100,
        "decimalPlaces": 2,
      },
    ],
    "isCalculated": false,
  },
  "seoTitle": "漁港数ランキング都道府県【2006年】｜1位長崎県（244港）",
  "seoDescription": "2006年の漁港数の都道府県別ランキング。1位長崎県（244港）、最下位滋賀県（0港）で地図やグラフで47都道府県を比較。",
  "isActive": true,
};
