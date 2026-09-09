// AUTO-GENERATED — DO NOT EDIT.
// Source of truth: packages/data-configs/src/theme-catalog/disability-support.ts
// Regenerate: npm run generate:catalog --workspace=@stats47/data-configs
import type { IndicatorSet } from "../indicator-set";

export const DISABILITY_SUPPORT_SET: IndicatorSet = {
  "key": "disability-support",
  "title": "障害福祉と社会参加",
  "description": "知的障害者援護施設の数・定員・在所者と身体障害者手帳交付数を比較します。制度区分の異なる人数を合算しません。",
  "category": "welfare",
  "usage": "theme",
  "metrics": [
    {
      "rankingKey": "intellectual-disability-support-facility-count-per-1m",
      "shortLabel": "知的障害者援護施設数",
      "role": "primary"
    },
    {
      "rankingKey": "intellectual-disability-support-facility-capacity-per-100k",
      "shortLabel": "知的障害者援護施設定員数",
      "role": "secondary"
    },
    {
      "rankingKey": "intellectual-disability-support-facility-residents-per-100k",
      "shortLabel": "知的障害者援護施設在所者数",
      "role": "secondary"
    },
    {
      "rankingKey": "physical-disability-certificates-issued-per-1000",
      "shortLabel": "身体障害者手帳交付数",
      "role": "secondary"
    }
  ],
  "keywords": [
    "障害福祉",
    "障害者手帳",
    "社会参加"
  ]
};
