// AUTO-GENERATED — DO NOT EDIT.
// Source of truth: packages/data-configs/src/theme-catalog/single-parent-households.ts
// Regenerate: npm run generate:catalog --workspace=@stats47/data-configs
import type { IndicatorSet } from "../indicator-set";

export const SINGLE_PARENT_HOUSEHOLDS_SET: IndicatorSet = {
  "key": "single-parent-households",
  "title": "ひとり親家庭の生活",
  "description": "母子世帯・父子世帯の世帯数と単独世帯割合を比較します。世帯数と生活条件を混ぜず、所得や就業の系列は追加取得後に章へ加えます。",
  "category": "demographics",
  "usage": "theme",
  "metrics": [
    {
      "rankingKey": "single-mother-households",
      "shortLabel": "母子世帯数",
      "role": "primary"
    },
    {
      "rankingKey": "single-father-households",
      "shortLabel": "父子世帯数",
      "role": "secondary"
    },
    {
      "rankingKey": "single-person-household-ratio",
      "shortLabel": "単独世帯割合",
      "role": "secondary"
    }
  ],
  "keywords": [
    "ひとり親",
    "母子世帯",
    "父子世帯"
  ]
};
