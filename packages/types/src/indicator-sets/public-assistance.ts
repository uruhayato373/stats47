// AUTO-GENERATED — DO NOT EDIT.
// Source of truth: packages/data-configs/src/theme-catalog/public-assistance.ts
// Regenerate: npm run generate:catalog --workspace=@stats47/data-configs
import type { IndicatorSet } from "../indicator-set";

export const PUBLIC_ASSISTANCE_SET: IndicatorSet = {
  "key": "public-assistance",
  "title": "生活保護と生活困窮",
  "description": "生活保護の実人員・実世帯数、保護費、施設定員を分けて比較します。受給者数の大小だけを困窮の原因や良否と解釈しません。",
  "category": "welfare",
  "usage": "theme",
  "metrics": [
    {
      "rankingKey": "persons-on-public-assistance-per-1000",
      "shortLabel": "生活保護被保護実人員",
      "role": "primary"
    },
    {
      "rankingKey": "households-on-public-assistance-per-1000",
      "shortLabel": "生活保護被保護実世帯数",
      "role": "secondary"
    },
    {
      "rankingKey": "public-assistance-expenses-prefecture",
      "shortLabel": "生活保護費",
      "role": "secondary"
    },
    {
      "rankingKey": "public-assistance-facility-capacity-per-1000",
      "shortLabel": "生活保護施設定員数",
      "role": "secondary"
    }
  ],
  "keywords": [
    "生活保護",
    "生活困窮",
    "社会保障"
  ]
};
