import type { MetricConfig } from "../types";

export const fishingPortCount: MetricConfig = {
  "key": "fishing-port-count",
  "title": "漁港数",
  "subtitle": "総数（水産庁）",
  "unit": "港",
  "category": "agriculture",
  "source": {
    "kind": "external",
    "fetcherKey": "mlit_ksj",
    "config": {
      "source": {
        "name": "国土数値情報（漁港）",
        "url": "https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-C09.html",
      },
      "ksjDataId": "C09",
      "ksjVersion": "06",
      "note": "fishing_ports テーブル（is_active=1）から集計",
    },
    "displayName": "国土数値情報（漁港）",
    "url": "https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-C09.html",
  },
  "surveyId": "mlit-ksj",
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2006,
    "to": 2006,
  },
  "yearFormat": "plain",
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
  "seoTitle": "漁港数ランキング都道府県【2006年】｜1位長崎県（288港）",
  "seoDescription": "2006年の漁港数の都道府県別ランキング。1位長崎県（288港）、最下位奈良県（0港）で地図やグラフで47都道府県を比較。",
  "isActive": false,
};
