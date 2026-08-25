// AUTO-GENERATED — DO NOT EDIT.
// Source of truth: packages/data-configs/src/theme-catalog/labor-mobility.ts
// Regenerate: npm run generate:catalog --workspace=@stats47/data-configs
import type { IndicatorSet } from "../indicator-set";

export const LABOR_MOBILITY_SET: IndicatorSet = {
  "key": "labor-mobility",
  "title": "人材流動性・雇用環境",
  "description": "都道府県別の離職率・転職率・有効求人倍率・テレワーク率から雇用の流動性を比較。47都道府県の労働市場タイプを可視化します。",
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
      "role": "secondary"
    },
    {
      "rankingKey": "unemployment-rate",
      "shortLabel": "失業率",
      "role": "secondary"
    },
    {
      "rankingKey": "employment-rate",
      "shortLabel": "就業率",
      "role": "context"
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
      "shortLabel": "月間労働時間(男)",
      "role": "context"
    },
    {
      "rankingKey": "employment-mobility-rate",
      "shortLabel": "就業異動率",
      "role": "context"
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
