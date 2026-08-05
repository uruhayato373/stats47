// AUTO-GENERATED — DO NOT EDIT.
// Source of truth: packages/data-configs/src/theme-catalog/manufacturing.ts
// Regenerate: npm run generate:catalog --workspace=@stats47/data-configs
import type { IndicatorSet } from "../indicator-set";

export const MANUFACTURING_SET: IndicatorSet = {
  "key": "manufacturing",
  "title": "製造業",
  "description": "都道府県別の製造品出荷額・付加価値額・事業所数・従業者数をランキングとチャートで比較。製造業の地域差を47都道府県のデータで確認できます。",
  "category": "industry",
  "usage": "theme",
  "metrics": [
    {
      "rankingKey": "manufacturing-shipment-amount",
      "shortLabel": "出荷額",
      "role": "primary"
    },
    {
      "rankingKey": "manufacturing-industry-added-value",
      "shortLabel": "付加価値額",
      "role": "secondary"
    },
    {
      "rankingKey": "manufacturing-establishments",
      "shortLabel": "事業所数",
      "role": "secondary"
    },
    {
      "rankingKey": "manufacturing-employees",
      "shortLabel": "従業者数",
      "role": "secondary"
    },
    {
      "rankingKey": "manufacturing-establishment-site-area",
      "shortLabel": "敷地面積",
      "role": "context"
    },
    {
      "rankingKey": "manufacturing-shipment-amount-per-employee",
      "shortLabel": "出荷額/人",
      "role": "secondary"
    },
    {
      "rankingKey": "manufacturing-shipment-amount-per-establishment",
      "shortLabel": "出荷額/所",
      "role": "secondary"
    },
    {
      "rankingKey": "industrial-land-price-change-rate",
      "shortLabel": "工業地価変動率",
      "role": "context"
    },
    {
      "rankingKey": "industrial-water-usage",
      "shortLabel": "工業用水量",
      "role": "context"
    }
  ],
  "keywords": [
    "製造業",
    "製造品出荷額",
    "付加価値額",
    "工場",
    "事業所",
    "都道府県",
    "ランキング"
  ]
};
