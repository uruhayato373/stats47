// AUTO-GENERATED — DO NOT EDIT.
// Source of truth: packages/data-configs/src/theme-catalog/retail-commerce.ts
// Regenerate: npm run generate:catalog --workspace=@stats47/data-configs
import type { IndicatorSet } from "../indicator-set";

export const RETAIL_COMMERCE_SET: IndicatorSet = {
  "key": "retail-commerce",
  "title": "商業と小売",
  "description": "小売業の事業所数、売場面積、年間商品販売額、従業者数を比較します。従業者数は社会・人口統計体系の2021年度行に掲載された調査日現在の人数です。販売額の年間フローと調査日のストックを分けて読みます。",
  "category": "economy",
  "usage": "theme",
  "metrics": [
    {
      "rankingKey": "retail-establishments-by-prefecture",
      "shortLabel": "小売業事業所数",
      "role": "primary"
    },
    {
      "rankingKey": "retail-sales-area-by-class",
      "shortLabel": "小売業売場面積",
      "role": "secondary"
    },
    {
      "rankingKey": "retail-sales-amount-by-prefecture",
      "shortLabel": "小売業年間商品販売額",
      "role": "secondary"
    },
    {
      "rankingKey": "retail-employees",
      "shortLabel": "小売業従業者数",
      "role": "secondary"
    }
  ],
  "keywords": [
    "小売",
    "商業",
    "販売額",
    "売場面積"
  ]
};
