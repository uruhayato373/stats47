// AUTO-GENERATED — DO NOT EDIT.
// Source of truth: packages/data-configs/src/theme-catalog/railway.ts
// Regenerate: npm run generate:catalog --workspace=@stats47/data-configs
import type { IndicatorSet } from "../indicator-set";

export const RAILWAY_SET: IndicatorSet = {
  "key": "railway",
  "title": "鉄道",
  "description": "都道府県別の鉄道駅乗降客数・JR/民鉄輸送人員・鉄道駅数をランキングとチャートで比較。首都圏・関西圏への利用集中と地方鉄道の縮小、旅客輸送とJR貨物の役割を47都道府県のデータで読み解きます。",
  "category": "economy",
  "usage": "theme",
  "metrics": [
    {
      "rankingKey": "railway-passengers",
      "shortLabel": "鉄道駅乗降客数",
      "role": "secondary"
    },
    {
      "rankingKey": "jr-passenger-transport",
      "shortLabel": "JR輸送人員",
      "role": "primary"
    },
    {
      "rankingKey": "private-railway-passenger-transport",
      "shortLabel": "民鉄輸送人員",
      "role": "secondary"
    },
    {
      "rankingKey": "railway-station-count",
      "shortLabel": "鉄道駅数",
      "role": "secondary"
    },
    {
      "rankingKey": "jr-freight-shipment",
      "shortLabel": "JR貨物発送量",
      "role": "context"
    }
  ],
  "keywords": [
    "鉄道",
    "JR",
    "私鉄",
    "民鉄",
    "駅",
    "乗降客",
    "輸送人員",
    "鉄道貨物"
  ],
  "relatedArticleTagKeys": [
    "鉄道",
    "交通",
    "公共交通"
  ]
};
