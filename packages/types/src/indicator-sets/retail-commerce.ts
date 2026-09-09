// AUTO-GENERATED — DO NOT EDIT.
// Source of truth: packages/data-configs/src/theme-catalog/retail-commerce.ts
// Regenerate: npm run generate:catalog --workspace=@stats47/data-configs
import type { IndicatorSet } from "../indicator-set";

export const RETAIL_COMMERCE_SET: IndicatorSet = {
  "key": "retail-commerce",
  "title": "商業と小売",
  "description": "小売業の事業所数、売場面積、年間商品販売額、商業従業者数を比較します。センサスの対象年を揃え、販売額と店舗数を足し合わせません。",
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
      "rankingKey": "number-of-commercial-employees-wholesale-retail",
      "shortLabel": "商業従業者数",
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
