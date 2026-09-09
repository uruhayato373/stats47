// AUTO-GENERATED — DO NOT EDIT.
// Source of truth: packages/data-configs/src/theme-catalog/natural-environment.ts
// Regenerate: npm run generate:catalog --workspace=@stats47/data-configs
import type { IndicatorSet } from "../indicator-set";

export const NATURAL_ENVIRONMENT_SET: IndicatorSet = {
  "key": "natural-environment",
  "title": "森林と自然環境",
  "description": "森林面積・森林率、人工林、自然環境保全地域、自然公園を別々に比較します。保全地域と森林面積を足して自然面積とは扱いません。",
  "category": "lifestyle",
  "usage": "theme",
  "metrics": [
    {
      "rankingKey": "forest-area",
      "shortLabel": "森林面積",
      "role": "primary"
    },
    {
      "rankingKey": "forest-area-ratio",
      "shortLabel": "森林面積割合",
      "role": "secondary"
    },
    {
      "rankingKey": "artificial-forest-area",
      "shortLabel": "人工林面積",
      "role": "secondary"
    },
    {
      "rankingKey": "natural-environment-conservation-area",
      "shortLabel": "自然環境保全地域面積",
      "role": "secondary"
    },
    {
      "rankingKey": "nature-park-area",
      "shortLabel": "自然公園面積",
      "role": "secondary"
    }
  ],
  "keywords": [
    "自然環境",
    "森林",
    "自然公園",
    "保全地域"
  ]
};
