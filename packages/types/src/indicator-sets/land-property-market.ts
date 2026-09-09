// AUTO-GENERATED — DO NOT EDIT.
// Source of truth: packages/data-configs/src/theme-catalog/land-property-market.ts
// Regenerate: npm run generate:catalog --workspace=@stats47/data-configs
import type { IndicatorSet } from "../indicator-set";

export const LAND_PROPERTY_MARKET_SET: IndicatorSet = {
  "key": "land-property-market",
  "title": "不動産取引と地価",
  "description": "住宅地・工業地の地価水準と変動率を分けて比較します。価格の水準と変化率は同じ尺度にせず、調査地点と基準日を確認します。",
  "category": "economy",
  "usage": "theme",
  "metrics": [
    {
      "rankingKey": "residential-land-price-change-rate",
      "shortLabel": "住宅地地価変動率",
      "role": "primary"
    },
    {
      "rankingKey": "industrial-land-price-change-rate",
      "shortLabel": "工業地地価変動率",
      "role": "secondary"
    },
    {
      "rankingKey": "industrial-land-price",
      "shortLabel": "工業地地価",
      "role": "secondary"
    }
  ],
  "keywords": [
    "地価",
    "不動産",
    "住宅地",
    "工業地"
  ]
};
