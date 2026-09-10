// AUTO-GENERATED — DO NOT EDIT.
// Source of truth: packages/data-configs/src/theme-catalog/consumer-prices.ts
// Regenerate: npm run generate:catalog --workspace=@stats47/data-configs
import type { IndicatorSet } from "../indicator-set";

export const CONSUMER_PRICES_SET: IndicatorSet = {
  "key": "consumer-prices",
  "title": "物価・消費",
  "description": "全国を100とする消費者物価地域差指数から、同じ年の総合水準と費目別の価格差を比較します。",
  "category": "economy",
  "usage": "theme",
  "metrics": [
    {
      "rankingKey": "consumer-price-difference-index-overall",
      "shortLabel": "総合",
      "role": "primary"
    },
    {
      "rankingKey": "consumer-price-difference-index-overall-excl-rent",
      "shortLabel": "家賃除く総合",
      "role": "secondary"
    },
    {
      "rankingKey": "consumer-price-difference-index-food",
      "shortLabel": "食料",
      "role": "secondary"
    },
    {
      "rankingKey": "consumer-price-difference-index-housing",
      "shortLabel": "住居",
      "role": "secondary"
    },
    {
      "rankingKey": "consumer-price-difference-index-utilities",
      "shortLabel": "光熱・水道",
      "role": "secondary"
    },
    {
      "rankingKey": "consumer-price-difference-index-education",
      "shortLabel": "教育",
      "role": "context"
    },
    {
      "rankingKey": "consumer-price-difference-index-culture-recreation",
      "shortLabel": "教養娯楽",
      "role": "context"
    },
    {
      "rankingKey": "consumer-price-difference-index-transport-communication",
      "shortLabel": "交通・通信",
      "role": "context"
    },
    {
      "rankingKey": "consumer-price-difference-index-healthcare",
      "shortLabel": "保健医療",
      "role": "context"
    },
    {
      "rankingKey": "consumer-price-difference-index-clothing-footwear",
      "shortLabel": "被服",
      "role": "context"
    },
    {
      "rankingKey": "consumer-price-difference-index-furniture-household",
      "shortLabel": "家具",
      "role": "context"
    },
    {
      "rankingKey": "consumer-price-difference-index-miscellaneous",
      "shortLabel": "諸雑費",
      "role": "context"
    },
    {
      "rankingKey": "household-survey-utilities-expenditure",
      "shortLabel": "光熱・水道支出（二人以上世帯・10〜11月の月平均）",
      "role": "secondary"
    },
    {
      "rankingKey": "average-temperature",
      "shortLabel": "年平均気温（代表観測地点）",
      "role": "secondary"
    },
    {
      "rankingKey": "household-survey-food-expenditure",
      "shortLabel": "食料支出（二人以上世帯・10〜11月の月平均）",
      "role": "secondary"
    }
  ],
  "keywords": [
    "消費者物価指数",
    "物価",
    "地域差指数",
    "生活コスト",
    "食費",
    "家賃",
    "都道府県",
    "ランキング"
  ]
};
