// AUTO-GENERATED — DO NOT EDIT.
// Source of truth: packages/data-configs/src/theme-catalog/long-term-care.ts
// Regenerate: npm run generate:catalog --workspace=@stats47/data-configs
import type { IndicatorSet } from "../indicator-set";

export const LONG_TERM_CARE_SET: IndicatorSet = {
  "key": "long-term-care",
  "title": "介護の需給",
  "description": "介護保険給付、老人ホームの数・定員・在所者を分けて比較します。高齢者人口当たり系列と実数を同じランキングにしません。",
  "category": "welfare",
  "usage": "theme",
  "metrics": [
    {
      "rankingKey": "nursing-care-insurance-benefit",
      "shortLabel": "介護保険給付費用額",
      "role": "primary"
    },
    {
      "rankingKey": "nursing-home-count-per-100k-65plus",
      "shortLabel": "老人ホーム数",
      "role": "secondary"
    },
    {
      "rankingKey": "nursing-home-capacity-per-1000-65plus",
      "shortLabel": "老人ホーム定員数",
      "role": "secondary"
    },
    {
      "rankingKey": "nursing-home-residents-per-1000-65plus",
      "shortLabel": "老人ホーム在所者数",
      "role": "secondary"
    }
  ],
  "keywords": [
    "介護",
    "介護保険",
    "老人ホーム"
  ]
};
