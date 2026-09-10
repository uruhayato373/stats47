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
      "role": "secondary"
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
      "rankingKey": "non-regular-employment-rate",
      "shortLabel": "非正規雇用率",
      "role": "secondary"
    },
    {
      "rankingKey": "nonregular-employees-count",
      "shortLabel": "非正規の職員・従業員数（15歳以上）",
      "role": "secondary"
    },
    {
      "rankingKey": "nonregular-continuation-wish-rate",
      "shortLabel": "非正規の継続就業希望割合",
      "role": "secondary"
    },
    {
      "rankingKey": "nonregular-job-change-wish-rate",
      "shortLabel": "非正規の転職希望割合",
      "role": "secondary"
    },
    {
      "rankingKey": "monthly-average-actual-working-hours-female",
      "shortLabel": "女性月間平均実労働時間",
      "role": "secondary"
    },
    {
      "rankingKey": "employees-weekly-hours-60plus-count",
      "shortLabel": "週60時間以上の雇用者数（年間200日以上）",
      "role": "secondary"
    },
    {
      "rankingKey": "employees-weekly-hours-60plus-rate",
      "shortLabel": "週60時間以上の雇用者割合（年間200日以上）",
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
