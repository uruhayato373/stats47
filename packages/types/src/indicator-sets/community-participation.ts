// AUTO-GENERATED — DO NOT EDIT.
// Source of truth: packages/data-configs/src/theme-catalog/community-participation.ts
// Regenerate: npm run generate:catalog --workspace=@stats47/data-configs
import type { IndicatorSet } from "../indicator-set";

export const COMMUNITY_PARTICIPATION_SET: IndicatorSet = {
  "key": "community-participation",
  "title": "市民参加と地域活動",
  "description": "ボランティア活動の年間行動者率・まちづくり活動の参加率と、選挙投票率・図書館登録者数を比較します。まちづくり活動は2021年社会生活基本調査の10歳以上が対象で、過去1年間の清掃や地域おこしなどの活動を捉えます。活動種類は重複し、自治会加入率や孤独感とは異なります。",
  "category": "demographics",
  "usage": "theme",
  "metrics": [
    {
      "rankingKey": "volunteer-activity-annual-participation-rate-10plus",
      "shortLabel": "ボランティア年間行動者率（10歳以上）",
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
    },
    {
      "rankingKey": "community-building-volunteer-participation-rate-10plus",
      "shortLabel": "まちづくり活動の年間行動者率（10歳以上）",
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
