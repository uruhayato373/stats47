// AUTO-GENERATED — DO NOT EDIT.
// Source of truth: packages/data-configs/src/theme-catalog/disability-support.ts
// Regenerate: npm run generate:catalog --workspace=@stats47/data-configs
import type { IndicatorSet } from "../indicator-set";

export const DISABILITY_SUPPORT_SET: IndicatorSet = {
  "key": "disability-support",
  "title": "障害福祉と社会参加",
  "description": "知的障害者援護施設の数・定員・在所者と身体障害者手帳交付数を比較します。制度区分の異なる人数を合算しません。障害者就職率は公共職業安定所における就職件数を新規求職申込件数で割った割合で、企業の実雇用率や障害者全体の就業率とは異なります。",
  "category": "welfare",
  "usage": "theme",
  "metrics": [
    {
      "rankingKey": "intellectual-disability-support-facility-count-per-1m",
      "shortLabel": "知的障害者援護施設数（人口100万人当たり）",
      "role": "primary"
    },
    {
      "rankingKey": "intellectual-disability-support-facility-capacity-per-100k",
      "shortLabel": "知的障害者援護施設定員数（人口10万人当たり）",
      "role": "secondary"
    },
    {
      "rankingKey": "intellectual-disability-support-facility-residents-per-100k",
      "shortLabel": "知的障害者援護施設在所者数（人口10万人当たり）",
      "role": "secondary"
    },
    {
      "rankingKey": "physical-disability-certificates-issued-per-1000",
      "shortLabel": "身体障害者手帳交付数（人口千人当たり）",
      "role": "secondary"
    },
    {
      "rankingKey": "disabled-employment-rate",
      "shortLabel": "障害者就職率（ハローワーク）",
      "role": "secondary"
    }
  ],
  "keywords": [
    "障害福祉",
    "障害者手帳",
    "社会参加"
  ]
};
