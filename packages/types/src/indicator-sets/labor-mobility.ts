// AUTO-GENERATED — DO NOT EDIT.
// Source of truth: packages/data-configs/src/theme-catalog/labor-mobility.ts
// Regenerate: npm run generate:catalog --workspace=@stats47/data-configs
import type { IndicatorSet } from "../indicator-set";

export const LABOR_MOBILITY_SET: IndicatorSet = {
  "key": "labor-mobility",
  "title": "人材流動性・雇用環境",
  "description": "求人・失業から雇用の需給を、離職・転職から仕事の移動を読み分ける。",
  "category": "economy",
  "usage": "theme",
  "metrics": [
    {
      "rankingKey": "turnover-rate",
      "shortLabel": "離職率",
      "role": "primary"
    },
    {
      "rankingKey": "job-change-rate",
      "shortLabel": "転職率",
      "role": "secondary"
    },
    {
      "rankingKey": "active-job-opening-ratio",
      "shortLabel": "有効求人倍率",
      "role": "primary"
    },
    {
      "rankingKey": "unemployment-rate",
      "shortLabel": "失業率",
      "role": "secondary"
    },
    {
      "rankingKey": "employment-rate",
      "shortLabel": "就職率（公共職業安定所）",
      "role": "secondary"
    },
    {
      "rankingKey": "telework-rate",
      "shortLabel": "テレワーク率",
      "role": "secondary"
    },
    {
      "rankingKey": "side-job-rate",
      "shortLabel": "副業率",
      "role": "context"
    },
    {
      "rankingKey": "monthly-average-actual-working-hours-male",
      "shortLabel": "月間平均実労働時間（男性）",
      "role": "context"
    },
    {
      "rankingKey": "employment-mobility-rate",
      "shortLabel": "就業異動率",
      "role": "secondary"
    },
    {
      "rankingKey": "day-time-population-ratio",
      "shortLabel": "昼夜間人口比率",
      "role": "secondary"
    },
    {
      "rankingKey": "monthly-average-actual-working-hours-female",
      "shortLabel": "女性月間平均実労働時間",
      "role": "secondary"
    },
    {
      "rankingKey": "commuter-ratio-to-other-municipalities",
      "shortLabel": "他市区町村への通勤者比率",
      "role": "secondary"
    }
  ],
  "keywords": [
    "離職率",
    "転職率",
    "有効求人倍率",
    "テレワーク",
    "人材流動性",
    "都道府県",
    "ランキング"
  ]
};
