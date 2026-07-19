import type { MetricConfig } from "../types";

export const portVehicleFerryCar: MetricConfig = {
  "key": "port-vehicle-ferry-car",
  "title": "フェリー輸送車両（乗用車）",
  "subtitle": "乗用車のみ",
  "unit": "台",
  "category": "tourism",
  "source": {
    "kind": "external",
    "fetcherKey": "estat",
    "displayName": "港湾統計（港湾調査）",
    "url": "https://www.e-stat.go.jp/dbview?sid=0003131104",
    "config": {
      "statsDataId": "0003131104",
      "note": "甲種+乙種港湾のmerge。旧 packages/database/scripts/populate-port-statistics.ts (git initial commit d1046434) の実装を復元 (41,733行/14 metric_keys、commit 60ed3014 で observations と100%一致確認済み)。再取得時は下記 merge の2テーブルを個別 fetch して port 単位で結合する。",
      "merge": [
        { "portClass": "甲種", "statsDataId": "0003131104", "cdCat01": "100", "cdCat02": "00001", "cdCat03": "130", "portDimension": "cat04" },
        { "portClass": "乙種", "statsDataId": "0003130820", "cdCat01": "100", "cdCat02": "130", "portDimension": "cat03" },
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
        "unit": "台/10万人",
        "scaleFactor": 100000,
        "decimalPlaces": 1,
      },
      {
        "type": "per_area",
        "label": "面積100km²あたり",
        "unit": "台/100km²",
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
