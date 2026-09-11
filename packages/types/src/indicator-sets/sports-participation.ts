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
      "shortLabel": "スポーツ年間行動者率（10歳以上）",
      "role": "primary"
    },
    {
      "rankingKey": "hobby-participation-rate-sports-spectating",
      "shortLabel": "スポーツ観覧の行動者率",
      "role": "secondary"
    },
    {
      "rankingKey": "community-sports-facility-count-per-million",
      "shortLabel": "社会体育施設数（人口100万人当たり）",
      "role": "secondary"
    },
    {
      "rankingKey": "sports-park-count",
      "shortLabel": "運動公園数",
      "role": "secondary"
    },
    {
      "rankingKey": "daily-steps-male-20to64-age-adjusted",
      "shortLabel": "男性の歩数（20〜64歳・年齢調整）",
      "role": "secondary"
    },
    {
      "rankingKey": "daily-steps-female-20to64-age-adjusted",
      "shortLabel": "女性の歩数（20〜64歳・年齢調整）",
      "role": "secondary"
    },
    {
      "rankingKey": "elementary-school-gymnasium-count",
      "shortLabel": "小学校体育館設置箇所数",
      "role": "secondary"
    },
    {
      "rankingKey": "junior-high-school-gymnasium-count",
      "shortLabel": "中学校体育館設置箇所数",
      "role": "secondary"
    },
    {
      "rankingKey": "elementary5-fitness-score-male",
      "shortLabel": "小学5年男子の体力合計点",
      "role": "secondary"
    },
    {
      "rankingKey": "elementary5-fitness-score-female",
      "shortLabel": "小学5年女子の体力合計点",
      "role": "secondary"
    },
    {
      "rankingKey": "elementary5-weekly-exercise-420min-rate-male",
      "shortLabel": "小学5年男子の週420分以上運動割合",
      "role": "secondary"
    },
    {
      "rankingKey": "elementary5-weekly-exercise-420min-rate-female",
      "shortLabel": "小学5年女子の週420分以上運動割合",
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
