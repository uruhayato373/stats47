// AUTO-GENERATED — DO NOT EDIT.
// Source of truth: packages/data-configs/src/theme-catalog/labor-wages.ts
// Regenerate: npm run generate:catalog --workspace=@stats47/data-configs
import type { IndicatorSet } from "../indicator-set";

export const LABOR_WAGES_SET: IndicatorSet = {
  "key": "labor-wages",
  "title": "労働・賃金",
  "description": "都道府県別の最低賃金、初任給、給与月額、男女の給与水準差、パート時給を、対象者と時間単位を分けて比較します。",
  "category": "economy",
  "usage": "theme",
  "metrics": [
    {
      "rankingKey": "minimum-wage-by-region",
      "shortLabel": "最低賃金",
      "role": "primary"
    },
    {
      "rankingKey": "starting-salary-university",
      "shortLabel": "大卒初任給",
      "role": "secondary"
    },
    {
      "rankingKey": "starting-salary-highschool",
      "shortLabel": "高卒初任給",
      "role": "secondary"
    },
    {
      "rankingKey": "scheduled-salary-male",
      "shortLabel": "所定内給与(男)",
      "role": "context"
    },
    {
      "rankingKey": "nurse-salary",
      "shortLabel": "看護師の所定内給与月額",
      "role": "context"
    },
    {
      "rankingKey": "gender-wage-gap",
      "shortLabel": "男女賃金格差",
      "role": "secondary"
    },
    {
      "rankingKey": "male-part-time-hourly-wage",
      "shortLabel": "パート時給（男性）",
      "role": "secondary"
    },
    {
      "rankingKey": "female-part-time-hourly-wage",
      "shortLabel": "パート時給(女)",
      "role": "secondary"
    },
    {
      "rankingKey": "active-job-opening-ratio",
      "shortLabel": "有効求人倍率",
      "role": "context"
    },
    {
      "rankingKey": "unemployment-rate",
      "shortLabel": "失業率",
      "role": "context"
    },
    {
      "rankingKey": "employment-rate",
      "shortLabel": "就職率（公共職業安定所）",
      "role": "context"
    },
    {
      "rankingKey": "employed-people-ratio",
      "shortLabel": "有業率",
      "role": "context"
    },
    {
      "rankingKey": "telework-rate",
      "shortLabel": "テレワーク率",
      "role": "context"
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
      "rankingKey": "turnover-rate",
      "shortLabel": "離職率",
      "role": "context"
    },
    {
      "rankingKey": "regular-cash-salary-male",
      "shortLabel": "現金給与月額（男）",
      "role": "secondary"
    },
    {
      "rankingKey": "regular-cash-salary-female",
      "shortLabel": "現金給与月額（女）",
      "role": "secondary"
    },
    {
      "rankingKey": "labor-force-population-ratio-woman",
      "shortLabel": "女性労働力人口比率",
      "role": "secondary"
    },
    {
      "rankingKey": "female-scheduled-earnings",
      "shortLabel": "女性所定内給与額",
      "role": "secondary"
    }
  ],
  "keywords": [
    "最低賃金",
    "初任給",
    "有効求人倍率",
    "失業率",
    "男女賃金格差",
    "都道府県",
    "ランキング"
  ]
};
