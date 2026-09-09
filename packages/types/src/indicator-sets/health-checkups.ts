// AUTO-GENERATED — DO NOT EDIT.
// Source of truth: packages/data-configs/src/theme-catalog/health-checkups.ts
// Regenerate: npm run generate:catalog --workspace=@stats47/data-configs
import type { IndicatorSet } from "../indicator-set";

export const HEALTH_CHECKUPS_SET: IndicatorSet = {
  "key": "health-checkups",
  "title": "生活習慣と健診",
  "description": "生活習慣病健診の受診延人員と歯科健診を別系列で比較します。健診の受診者数を健康状態そのものとは解釈しません。受診率は公式系列を取得後に追加します。",
  "category": "welfare",
  "usage": "theme",
  "metrics": [
    {
      "rankingKey": "health-checkup-recipients",
      "shortLabel": "生活習慣病健康診断受診延人員",
      "role": "primary"
    },
    {
      "rankingKey": "dental-checkup-persons-per-1000",
      "shortLabel": "歯科健診受診延人員",
      "role": "secondary"
    }
  ],
  "keywords": [
    "健診",
    "生活習慣病",
    "歯科健診"
  ]
};
