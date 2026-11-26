import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const portShipsTotal: MetricConfig = {
  "key": "port-ships-total",
  "title": "入港船舶隻数（合計）",
  "subtitle": "全種別合計",
  "unit": "隻",
  "category": "tourism",
  "source": {
    "kind": "external",
    "fetcherKey": "estat",
    "displayName": "港湾統計（港湾調査）",
    "url": "https://www.e-stat.go.jp/dbview?sid=0003130814",
    "config": {
      "statsDataId": "0003130814",
      "note": "甲種+乙種港湾のmerge (港単位の生データ。都道府県集計版は port-inbound-ships / statsDataId 0003130773)。旧 packages/database/scripts/populate-port-statistics.ts (git initial commit d1046434) の実装を復元 (41,733行/14 metric_keys、commit 60ed3014 で observations と100%一致確認済み)。",
      "merge": [
        { "portClass": "甲種", "statsDataId": "0003130814", "cdTab": "110", "cdCat01": "100", "cdCat02": "100", "portDimension": "cat03" },
        { "portClass": "乙種", "statsDataId": "0003130816", "cdTab": "110", "cdCat01": "100", "cdCat02": "100", "portDimension": "cat03" },
      ],
    },
  },
  "entities": [
    "port",
  ],
  visualization: {
    ...DEFAULT_METRIC_PRESENTATION,
    "colorScheme": "interpolateBlues",
    "colorSchemeType": "sequential",
  },
  "years": {
    "from": 2010,
    "to": 2023,
  },
  "yearFormat": "calendar",
  "calculation": {
    "normalizationOptions": [
      {
        "denominator": { "kind": "population", "per": 100000 },
        "unit": "隻/10万人",
        "decimalPlaces": 1,
      },
      {
        "denominator": { "kind": "area", "per": 100 },
        "unit": "隻/100km²",
        "decimalPlaces": 2,
      },
    ],
    "isCalculated": false,
  },
  "isActive": true,
};
