// AUTO-GENERATED — DO NOT EDIT.
// Source of truth: packages/data-configs/src/theme-catalog/land-property-market.ts
// Regenerate: npm run generate:catalog --workspace=@stats47/data-configs
import type { IndicatorSet } from "../indicator-set";

export const LAND_PROPERTY_MARKET_SET: IndicatorSet = {
  "key": "land-property-market",
  "title": "不動産取引と地価",
  "description": "2025年の住宅地について、100㎡以上300㎡未満の土地の取引単価と公示価格の分布・標本数を示します。住宅地の区分と基準時点が異なるため、両系列は分けて読みます。住宅地・工業地の地価変動率も確認できます。",
  "category": "economy",
  "usage": "theme",
  "metrics": [
    {
      "rankingKey": "residential-land-transaction-median-price",
      "shortLabel": "住宅地の取引単価中央値（100〜300㎡未満）",
      "role": "primary"
    },
    {
      "rankingKey": "residential-land-transaction-sample-count",
      "shortLabel": "住宅地の取引価格標本数",
      "role": "secondary"
    },
    {
      "rankingKey": "residential-official-land-median-price",
      "shortLabel": "住宅地の公示価格中央値（100〜300㎡未満）",
      "role": "secondary"
    },
    {
      "rankingKey": "residential-official-land-point-count",
      "shortLabel": "住宅地の公示標準地数",
      "role": "secondary"
    },
    {
      "rankingKey": "residential-land-price-change-rate",
      "shortLabel": "住宅地地価変動率",
      "role": "primary"
    },
    {
      "rankingKey": "industrial-land-price-change-rate",
      "shortLabel": "標準価格変動率（工業地）",
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
