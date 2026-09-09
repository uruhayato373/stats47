// AUTO-GENERATED — DO NOT EDIT.
// Source of truth: packages/data-configs/src/theme-catalog/sports-participation.ts
// Regenerate: npm run generate:catalog --workspace=@stats47/data-configs
import type { IndicatorSet } from "../indicator-set";

export const SPORTS_PARTICIPATION_SET: IndicatorSet = {
  "key": "sports-participation",
  "title": "スポーツ施設と利用",
  "description": "スポーツの年間行動者率・観覧率と社会体育施設数を参加と供給に分けて比較します。施設数から利用者数は推計しません。",
  "category": "education",
  "usage": "theme",
  "metrics": [
    {
      "rankingKey": "sports-annual-participation-rate-10plus",
      "shortLabel": "スポーツ年間行動者率",
      "role": "primary"
    },
    {
      "rankingKey": "hobby-participation-rate-sports-spectating",
      "shortLabel": "スポーツ観覧の行動者率",
      "role": "secondary"
    },
    {
      "rankingKey": "community-sports-facility-count-per-million",
      "shortLabel": "社会体育施設数",
      "role": "secondary"
    },
    {
      "rankingKey": "sports-park-count",
      "shortLabel": "運動公園数",
      "role": "secondary"
    }
  ],
  "keywords": [
    "スポーツ",
    "施設",
    "運動",
    "観覧"
  ]
};
