// AUTO-GENERATED — DO NOT EDIT.
// Source of truth: packages/data-configs/src/theme-catalog/natural-environment.ts
// Regenerate: npm run generate:catalog --workspace=@stats47/data-configs
import type { IndicatorSet } from "../indicator-set";

export const NATURAL_ENVIRONMENT_SET: IndicatorSet = {
  "key": "natural-environment",
  "title": "森林と自然環境",
  "description": "森林面積・林野面積割合、人工造林面積、自然環境保全地域、自然公園を別々に比較します。人工造林面積は植林した面積で、人工林全体の面積ではありません。保全地域と森林面積を足して自然面積とは扱いません。2024年の国立・国定公園の年間延べ利用者数も比較できます。利用者数は県立公園を含まないため、自然公園全体の面積との比率は計算しません。",
  "category": "lifestyle",
  "usage": "theme",
  "metrics": [
    {
      "rankingKey": "woodland-area",
      "shortLabel": "森林面積",
      "role": "primary"
    },
    {
      "rankingKey": "forest-area-ratio",
      "shortLabel": "林野面積割合",
      "role": "secondary"
    },
    {
      "rankingKey": "artificial-forest-area",
      "shortLabel": "人工造林面積",
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
    },
    {
      "rankingKey": "national-quasi-national-park-visits",
      "shortLabel": "国立・国定公園の年間延べ利用者数",
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
