// AUTO-GENERATED — DO NOT EDIT.
// Source of truth: packages/data-configs/src/theme-catalog/construction-industry.ts
// Regenerate: npm run generate:catalog --workspace=@stats47/data-configs
import type { IndicatorSet } from "../indicator-set";

export const CONSTRUCTION_INDUSTRY_SET: IndicatorSet = {
  "key": "construction-industry",
  "title": "建設業",
  "description": "建設業の完成工事高・許可業者数と、民営事業所で働く従業者数を都道府県別に比較します。工事の取引段階と統計の対象年を分けて確認できます。",
  "category": "economy",
  "usage": "theme",
  "metrics": [
    {
      "rankingKey": "prime-contractor-completed-construction",
      "shortLabel": "元請完成工事高",
      "role": "primary"
    },
    {
      "rankingKey": "construction-industry-count",
      "shortLabel": "許可業者数",
      "role": "secondary"
    },
    {
      "rankingKey": "subcontractor-completed-construction",
      "shortLabel": "下請完成工事高",
      "role": "context"
    },
    {
      "rankingKey": "construction-private-employees",
      "shortLabel": "従業者数",
      "role": "secondary"
    }
  ],
  "keywords": [
    "建設業",
    "完成工事高",
    "許可業者数",
    "従業者数"
  ]
};
