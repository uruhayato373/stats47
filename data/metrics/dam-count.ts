import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const damCount: MetricConfig = {
  "key": "dam-count",
  "title": "ダム数",
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
      "ksjDataId": "W01",
      "ksjVersion": "14",
      "description": "国土数値情報に登録されているダムの都道府県別数",
    },
    "displayName": "国土数値情報",
    "url": "https://nlftp.mlit.go.jp/ksj/index.html",
  },
  "surveyId": "mlit-ksj",
  "entities": [
    "prefecture",
  ],
  visualization: {
    ...DEFAULT_METRIC_PRESENTATION,
    "colorScheme": "interpolateBlues",
    "colorSchemeType": "sequential",
  },
  "years": {
    "from": 2014,
    "to": 2014,
  },
  "yearFormat": "calendar",
  "calculation": {
    "normalizationOptions": [
      {
        "denominator": { "kind": "population", "per": 100000 },
        "unit": "か所/10万人",
        "decimalPlaces": 1,
      },
      {
        "denominator": { "kind": "area", "per": 100 },
        "unit": "か所/100km²",
        "decimalPlaces": 2,
      },
    ],
    "isCalculated": false,
  },
  // 2026-08-17: 県の帰属を最寄り県庁所在地から属性/空間結合へ是正し値が変わった
  // (KSJ-PREF-ASSIGN-01)。
  "seoTitle": "ダム数ランキング都道府県｜なぜ北海道が190か所で突出?【2014】",
  "isActive": false,
};
