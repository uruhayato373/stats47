// AUTO-GENERATED — DO NOT EDIT.
// Source of truth: packages/data-configs/src/theme-catalog/cultural-participation.ts
// Regenerate: npm run generate:catalog --workspace=@stats47/data-configs
import type { IndicatorSet } from "../indicator-set";

export const CULTURAL_PARTICIPATION_SET: IndicatorSet = {
  "key": "cultural-participation",
  "title": "文化芸術への参加",
  "description": "美術・演劇などの鑑賞行動者率、図書館利用、博物館数を参加・施設の軸に分けて比較します。行動者率と施設数を合算しません。",
  "category": "education",
  "usage": "theme",
  "metrics": [
    {
      "rankingKey": "hobby-participation-rate-art-appreciation",
      "shortLabel": "美術鑑賞の行動者率",
      "role": "primary"
    },
    {
      "rankingKey": "hobby-participation-rate-theater",
      "shortLabel": "演芸・演劇・舞踊鑑賞の行動者率",
      "role": "secondary"
    },
    {
      "rankingKey": "library-lending-books",
      "shortLabel": "図書館館外貸出冊数",
      "role": "secondary"
    },
    {
      "rankingKey": "total-museum-count",
      "shortLabel": "博物館総数",
      "role": "secondary"
    }
  ],
  "keywords": [
    "文化",
    "芸術",
    "図書館",
    "博物館"
  ]
};
