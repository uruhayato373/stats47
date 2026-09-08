// AUTO-GENERATED — DO NOT EDIT.
// Source of truth: packages/data-configs/src/theme-catalog/manufacturing.ts
// Regenerate: npm run generate:catalog --workspace=@stats47/data-configs
import type { IndicatorSet } from "../indicator-set";

export const MANUFACTURING_SET: IndicatorSet = {
  "key": "manufacturing",
  "title": "製造業",
  "description": "製造業の生産規模、拠点と雇用、人員当たりの出荷規模を比較する。",
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
      "shortLabel": "出荷額等（従業者1人当たり）",
      "role": "secondary"
    },
    {
      "rankingKey": "manufacturing-shipment-amount-per-establishment",
      "shortLabel": "出荷額等（1事業所当たり）",
      "role": "context"
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
