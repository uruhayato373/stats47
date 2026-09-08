// AUTO-GENERATED — DO NOT EDIT.
// Source of truth: packages/data-configs/src/theme-catalog/roads.ts
// Regenerate: npm run generate:catalog --workspace=@stats47/data-configs
import type { IndicatorSet } from "../indicator-set";

export const ROADS_SET: IndicatorSet = {
  "key": "roads",
  "title": "道路",
  "description": "道路ストックの延長と密度、利用交通量、整備状況を分けて比較する。",
  "category": "economy",
  "usage": "theme",
  "metrics": [
    {
      "rankingKey": "road-total-length-with-expressway",
      "shortLabel": "道路実延長(高速含む)",
      "role": "primary"
    },
    {
      "rankingKey": "road-expressway-length",
      "shortLabel": "高速道路延長",
      "role": "secondary"
    },
    {
      "rankingKey": "road-total-length",
      "shortLabel": "道路実延長",
      "role": "context"
    },
    {
      "rankingKey": "road-national-route-length",
      "shortLabel": "一般国道延長",
      "role": "context"
    },
    {
      "rankingKey": "road-prefectural-route-length",
      "shortLabel": "主要地方道延長",
      "role": "context"
    },
    {
      "rankingKey": "road-municipal-length",
      "shortLabel": "市町村道延長",
      "role": "context"
    },
    {
      "rankingKey": "road-length-per-km2",
      "shortLabel": "道路実延長（総面積1km²当たり）",
      "role": "secondary"
    },
    {
      "rankingKey": "main-road-paving-rate",
      "shortLabel": "主要道路舗装率",
      "role": "secondary"
    },
    {
      "rankingKey": "average-road-traffic-volume",
      "shortLabel": "道路平均交通量（昼間12時間）",
      "role": "secondary"
    },
    {
      "rankingKey": "roadside-station-count",
      "shortLabel": "道の駅数",
      "role": "context"
    }
  ],
  "keywords": [
    "道路",
    "高速道路",
    "国道",
    "県道",
    "舗装率",
    "交通量",
    "道の駅",
    "インフラ"
  ],
  "relatedArticleTagKeys": [
    "道路",
    "高速道路",
    "交通",
    "インフラ"
  ]
};
