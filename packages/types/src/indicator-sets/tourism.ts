// AUTO-GENERATED — DO NOT EDIT.
// Source of truth: packages/data-configs/src/theme-catalog/tourism.ts
// Regenerate: npm run generate:catalog --workspace=@stats47/data-configs
import type { IndicatorSet } from "../indicator-set";

export const TOURISM_SET: IndicatorSet = {
  "key": "tourism",
  "title": "観光",
  "description": "来訪者の宿泊需要、受入供給と利用率、交通アクセスの違いを把握する。",
  "category": "tourism",
  "usage": "theme",
  "metrics": [
    {
      "rankingKey": "total-overnight-guests",
      "shortLabel": "延べ宿泊者数（総数）",
      "role": "primary"
    },
    {
      "rankingKey": "total-overnight-guests-foreign",
      "shortLabel": "外国人延べ宿泊者数",
      "role": "secondary"
    },
    {
      "rankingKey": "room-utilization-rate",
      "shortLabel": "客室稼働率",
      "role": "secondary"
    },
    {
      "rankingKey": "travel-participation-rate-domestic-tourism",
      "shortLabel": "国内旅行率",
      "role": "context"
    },
    {
      "rankingKey": "travel-participation-rate-overseas",
      "shortLabel": "海外旅行率",
      "role": "context"
    },
    {
      "rankingKey": "travel-participation-rate-overnight",
      "shortLabel": "宿泊旅行率",
      "role": "context"
    },
    {
      "rankingKey": "travel-participation-rate-day-trip",
      "shortLabel": "日帰り旅行率",
      "role": "context"
    },
    {
      "rankingKey": "air-passenger-transport",
      "shortLabel": "航空旅客",
      "role": "context"
    },
    {
      "rankingKey": "jr-passenger-transport",
      "shortLabel": "JR旅客",
      "role": "context"
    },
    {
      "rankingKey": "number-of-simple-lodging-facilities",
      "shortLabel": "簡易宿所数",
      "role": "context"
    },
    {
      "rankingKey": "number-of-hotel-facilities",
      "shortLabel": "ホテル営業施設数",
      "role": "context"
    },
    {
      "rankingKey": "number-of-hotel-rooms",
      "shortLabel": "ホテル客室数",
      "role": "context"
    }
  ],
  "keywords": [
    "観光",
    "宿泊者数",
    "インバウンド",
    "客室稼働率",
    "都道府県",
    "ランキング"
  ]
};
