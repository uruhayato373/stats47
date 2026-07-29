import type { MetricConfig } from "../types";

export const portContainerTonnage: MetricConfig = {
  "key": "port-container-tonnage",
  "title": "コンテナ取扱トン数",
  "unit": "トン",
  "category": "tourism",
  "source": {
    "kind": "external",
    "fetcherKey": "estat",
    "displayName": "港湾統計（港湾調査）",
    "url": "https://www.e-stat.go.jp/dbview?sid=0003130745",
    "config": {
      "statsDataId": "0003130745",
      "note": "甲種港湾のみ (旧 packages/database/scripts/populate-port-statistics.ts のコメント: 「乙種 container_tonnage: cat03 に合計コードがないためスキップ」)。git initial commit d1046434 の実装を復元 (41,733行/14 metric_keys、commit 60ed3014 で observations と100%一致確認済み)。",
      "merge": [
        { "portClass": "甲種", "statsDataId": "0003130745", "cdCat01": "100", "cdCat02": "100", "portDimension": "cat03" },
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
        "unit": "トン/10万人",
        "scaleFactor": 100000,
        "decimalPlaces": 1,
      },
      {
        "type": "per_area",
        "label": "面積100km²あたり",
        "unit": "トン/100km²",
        "scaleFactor": 100,
        "decimalPlaces": 2,
      },
    ],
    "isCalculated": false,
  },
  "isActive": true,
};
