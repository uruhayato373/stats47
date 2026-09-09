// AUTO-GENERATED — DO NOT EDIT.
// Source of truth: packages/data-configs/src/theme-catalog/innovation-patents.ts
// Regenerate: npm run generate:catalog --workspace=@stats47/data-configs
import type { IndicatorSet } from "../indicator-set";

export const INNOVATION_PATENTS_SET: IndicatorSet = {
  "key": "innovation-patents",
  "title": "研究開発と特許",
  "description": "研究者の平均年収など研究人材の基礎指標を掲載します。特許出願・登録件数は原典系列を取得後に追加し、研究者数を特許件数の代用にはしません。",
  "category": "industry",
  "usage": "theme",
  "metrics": [
    {
      "rankingKey": "researcher-annual-income",
      "shortLabel": "研究者の平均年収",
      "role": "primary"
    },
    {
      "rankingKey": "university-count-per-100k",
      "shortLabel": "大学数（人口10万人当たり）",
      "role": "secondary"
    }
  ],
  "keywords": [
    "研究開発",
    "研究者",
    "特許",
    "イノベーション"
  ]
};
