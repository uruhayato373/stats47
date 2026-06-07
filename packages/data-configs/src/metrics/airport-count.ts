import type { MetricConfig } from "../types";

export const airportCount: MetricConfig = {
  "key": "airport-count",
  "title": "空港数",
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
      "ksjDataId": "C28",
      "ksjVersion": "07",
      "description": "国土数値情報に登録されている空港の都道府県別数",
    },
    "displayName": "国土数値情報",
    "url": "https://nlftp.mlit.go.jp/ksj/index.html",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2007,
    "to": 2007,
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
  "seoTitle": "空港数ランキング都道府県【2007年】｜1位沖縄県（18か所）",
  "seoDescription": "2007年の空港数の都道府県別ランキング。1位沖縄県（18か所）、最下位奈良県（0か所）で地図やグラフで47都道府県を比較。",
  "isActive": true,
  "isFeatured": false,
  "featuredOrder": 0,
};
