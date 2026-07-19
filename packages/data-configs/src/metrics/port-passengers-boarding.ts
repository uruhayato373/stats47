import type { MetricConfig } from "../types";

export const portPassengersBoarding: MetricConfig = {
  "key": "port-passengers-boarding",
  "title": "旅客数（乗込）",
  "subtitle": "乗船",
  "unit": "人",
  "category": "tourism",
  "source": {
    "kind": "external",
    "fetcherKey": "estat",
    "displayName": "港湾統計（港湾調査）",
    "url": "https://www.e-stat.go.jp/dbview?sid=0003130801",
    "config": {
      "statsDataId": "0003130801",
      "note": "甲種+乙種港湾のmerge。旧 packages/database/scripts/populate-port-statistics.ts (git initial commit d1046434) の実装を復元 (41,733行/14 metric_keys、commit 60ed3014 で observations と100%一致確認済み)。再取得時は下記 merge の2テーブルを個別 fetch して port 単位で結合する。",
      "merge": [
        { "portClass": "甲種", "statsDataId": "0003130801", "cdCat01": "110", "cdCat02": "100", "portDimension": "cat03" },
        { "portClass": "乙種", "statsDataId": "0003130817", "cdCat01": "110", "cdCat02": "100", "portDimension": "cat03" },
      ],
    },
  },
  "entities": [
    "port",
  ],
  "years": {
    "from": 2010,
    "to": 2023,
  },
  "yearFormat": "calendar",
  "calculation": {
    "normalizationOptions": [
      {
        "type": "per_population",
        "label": "人口10万人あたり",
        "unit": "人/10万人",
        "scaleFactor": 100000,
        "decimalPlaces": 1,
      },
      {
        "type": "per_area",
        "label": "面積100km²あたり",
        "unit": "人/100km²",
        "scaleFactor": 100,
        "decimalPlaces": 2,
      },
    ],
    "isCalculated": false,
  },
  "isActive": true,
  "isFeatured": false,
  "featuredOrder": 0,
};
