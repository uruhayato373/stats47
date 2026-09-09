// AUTO-GENERATED — DO NOT EDIT.
// Source of truth: packages/data-configs/src/theme-catalog/community-participation.ts
// Regenerate: npm run generate:catalog --workspace=@stats47/data-configs
import type { IndicatorSet } from "../indicator-set";

export const COMMUNITY_PARTICIPATION_SET: IndicatorSet = {
  "key": "community-participation",
  "title": "市民参加と地域活動",
  "description": "ボランティア活動の年間行動者率と選挙投票率、図書館登録者数を市民参加の異なる側面として比較します。異なる母数の率を合算しません。",
  "category": "demographics",
  "usage": "theme",
  "metrics": [
    {
      "rankingKey": "volunteer-activity-annual-participation-rate-10plus",
      "shortLabel": "ボランティア年間行動者率",
      "role": "primary"
    },
    {
      "rankingKey": "voter-turnout-governor",
      "shortLabel": "都道府県知事選挙投票率",
      "role": "secondary"
    },
    {
      "rankingKey": "library-registered-users",
      "shortLabel": "図書館登録者数",
      "role": "secondary"
    }
  ],
  "keywords": [
    "市民参加",
    "ボランティア",
    "投票率",
    "地域活動"
  ]
};
