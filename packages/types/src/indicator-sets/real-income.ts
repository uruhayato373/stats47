// AUTO-GENERATED — DO NOT EDIT.
// Source of truth: packages/data-configs/src/theme-catalog/real-income.ts
// Regenerate: npm run generate:catalog --workspace=@stats47/data-configs
import type { IndicatorSet } from "../indicator-set";

export const REAL_INCOME_SET: IndicatorSet = {
  "key": "real-income",
  "title": "実質収入・購買力",
  "description": "都道府県別の名目収入を消費者物価地域差指数で補正し、実質的な購買力を比較。可処分所得・県民所得・家賃控除後手残りで「本当に豊かな県」を47都道府県のデータで確認できます。",
  "category": "economy",
  "usage": "theme",
  "metrics": [
    {
      "rankingKey": "disposable-income-worker-households",
      "shortLabel": "可処分所得",
      "role": "primary"
    },
    {
      "rankingKey": "actual-income-worker-households-per-month",
      "shortLabel": "実収入",
      "role": "secondary"
    },
    {
      "rankingKey": "per-capita-prefectural-income-h27",
      "shortLabel": "県民所得/人",
      "role": "secondary"
    },
    {
      "rankingKey": "annual-income-per-household",
      "shortLabel": "世帯年収",
      "role": "context"
    },
    {
      "rankingKey": "real-disposable-income",
      "shortLabel": "実質可処分所得",
      "role": "primary"
    },
    {
      "rankingKey": "disposable-income-after-rent",
      "shortLabel": "家賃控除後手残り",
      "role": "secondary"
    },
    {
      "rankingKey": "consumer-price-difference-index-overall",
      "shortLabel": "CPI総合",
      "role": "context"
    },
    {
      "rankingKey": "consumer-price-difference-index-overall-excl-rent",
      "shortLabel": "CPI(家賃除く)",
      "role": "context"
    },
    {
      "rankingKey": "consumer-price-difference-index-housing",
      "shortLabel": "CPI(住居)",
      "role": "context"
    },
    {
      "rankingKey": "private-rental-housing-rent-per-3-3m2",
      "shortLabel": "家賃/3.3m²",
      "role": "context"
    },
    {
      "rankingKey": "private-rent-consumption-expenditure",
      "shortLabel": "家賃支出",
      "role": "context"
    },
    {
      "rankingKey": "consumer-price-difference-index-food",
      "shortLabel": "消費者物価地域差指数",
      "role": "context"
    }
  ],
  "keywords": [
    "実質年収",
    "実質購買力",
    "物価補正",
    "可処分所得",
    "家賃控除",
    "手残り",
    "都道府県",
    "ランキング"
  ]
};
