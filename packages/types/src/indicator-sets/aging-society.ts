// AUTO-GENERATED — DO NOT EDIT.
// Source of truth: packages/data-configs/src/theme-catalog/aging-society.ts
// Regenerate: npm run generate:catalog --workspace=@stats47/data-configs
import type { IndicatorSet } from "../indicator-set";

export const AGING_SOCIETY_SET: IndicatorSet = {
  "key": "aging-society",
  "title": "少子高齢化",
  "description": "都道府県別の合計特殊出生率・高齢化率・人口増減率をランキングとチャートで比較。少子高齢化の実態を47都道府県のデータで確認できます。",
  "category": "demographics",
  "usage": "theme",
  "metrics": [
    {
      "rankingKey": "ratio-65-plus",
      "shortLabel": "65歳以上割合",
      "role": "primary"
    },
    {
      "rankingKey": "aging-index",
      "shortLabel": "老年化指数",
      "role": "secondary"
    },
    {
      "rankingKey": "total-fertility-rate",
      "shortLabel": "合計特殊出生率",
      "role": "primary"
    },
    {
      "rankingKey": "crude-birth-rate",
      "shortLabel": "粗出生率",
      "role": "context"
    },
    {
      "rankingKey": "crude-death-rate",
      "shortLabel": "死亡率",
      "role": "context"
    },
    {
      "rankingKey": "average-age-of-first-marriage-wife",
      "shortLabel": "初婚年齢(妻)",
      "role": "context"
    },
    {
      "rankingKey": "population-growth-rate",
      "shortLabel": "人口増減率",
      "role": "context"
    },
    {
      "rankingKey": "natural-increase-rate",
      "shortLabel": "自然増減率",
      "role": "context"
    },
    {
      "rankingKey": "social-increase-rate",
      "shortLabel": "社会増減率",
      "role": "context"
    },
    {
      "rankingKey": "dependent-population-index",
      "shortLabel": "従属人口指数",
      "role": "context"
    },
    {
      "rankingKey": "household-ratio-with-65plus",
      "shortLabel": "65歳以上を含む世帯率",
      "role": "secondary"
    },
    {
      "rankingKey": "marriages-per-total-population",
      "shortLabel": "婚姻率",
      "role": "context"
    },
    {
      "rankingKey": "divorces-per-total-population",
      "shortLabel": "離婚率",
      "role": "context"
    },
    {
      "rankingKey": "births",
      "shortLabel": "出生数",
      "role": "context"
    },
    {
      "rankingKey": "death-count",
      "shortLabel": "死亡数",
      "role": "context"
    },
    {
      "rankingKey": "late-elderly-medical-expense-per-insured",
      "shortLabel": "後期高齢者1人当たり医療費",
      "role": "secondary"
    },
    {
      "rankingKey": "total-population",
      "shortLabel": "総人口",
      "role": "context"
    },
    {
      "rankingKey": "single-person-household-old-population-ratio",
      "shortLabel": "高齢単独世帯率",
      "role": "primary"
    },
    {
      "rankingKey": "elderly-couple-only-household-ratio",
      "shortLabel": "高齢夫婦のみ世帯率",
      "role": "primary"
    },
    {
      "rankingKey": "pension-benefit-total",
      "shortLabel": "厚生年金受給権者年金総額",
      "role": "context"
    },
    {
      "rankingKey": "volunteer-activity-annual-participation-rate-15plus",
      "shortLabel": "ボランティア活動の年間行動者率",
      "role": "context"
    },
    {
      "rankingKey": "young-population-index",
      "shortLabel": "年少人口指数",
      "role": "context"
    },
    {
      "rankingKey": "old-population-index",
      "shortLabel": "老年人口指数",
      "role": "context"
    }
  ],
  "keywords": [
    "少子高齢化",
    "高齢化率",
    "合計特殊出生率",
    "人口減少",
    "都道府県",
    "ランキング"
  ]
};
