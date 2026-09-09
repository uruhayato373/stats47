// AUTO-GENERATED — DO NOT EDIT.
// Source of truth: packages/data-configs/src/theme-catalog/forestry-timber.ts
// Regenerate: npm run generate:catalog --workspace=@stats47/data-configs
import type { IndicatorSet } from "../indicator-set";

export const FORESTRY_TIMBER_SET: IndicatorSet = {
  "key": "forestry-timber",
  "title": "森林・林業・木材産業",
  "description": "森林面積・森林率、人工林、林道延長を並べ、森林の規模と林業基盤を分けて読みます。各面積を合算して自然面積とは扱いません。",
  "category": "industry",
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
      "rankingKey": "forest-road-length",
      "shortLabel": "林道延長",
      "role": "secondary"
    }
  ],
  "keywords": [
    "森林",
    "林業",
    "人工林",
    "林道"
  ]
};
