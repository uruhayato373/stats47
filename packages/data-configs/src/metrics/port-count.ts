import type { MetricConfig } from "../types";

export const portCount: MetricConfig = {
  "key": "port-count",
  "title": "港湾数",
  "unit": "港",
  "category": "infrastructure",
  "source": {
    "kind": "external",
    "fetcherKey": "mlit_ksj",
    "config": {
      "source": {
        "name": "国土交通省港湾局",
        "url": "https://www.mlit.go.jp/kowan/",
      },
      "note": "ports テーブル（甲種・乙種、is_active=1）から集計",
    },
    "displayName": "国土交通省港湾局",
    "url": "https://www.mlit.go.jp/kowan/",
  },
  "surveyId": "mlit-ksj",
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2024,
    "to": 2024,
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
  "seoTitle": "港湾数ランキング都道府県【2024年】｜1位鹿児島県（62港）",
  "seoDescription": "2024年の港湾数の都道府県別ランキング。1位鹿児島県（62港）、最下位奈良県（0港）で地図やグラフで47都道府県を比較。",
  "isActive": true,
};
