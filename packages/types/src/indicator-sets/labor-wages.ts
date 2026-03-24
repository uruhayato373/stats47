import type { IndicatorSet } from "../indicator-set";

export const LABOR_WAGES_SET: IndicatorSet = {
  key: "labor-wages",
  title: "労働・賃金",
  description:
    "都道府県別の最低賃金・初任給・有効求人倍率・失業率を地図とランキングで比較。労働市場の地域差を47都道府県のデータで確認できます。",
  category: "economy",
  usage: "theme",
  indicators: [
    // 賃金
    { rankingKey: "minimum-wage-by-region", shortLabel: "最低賃金", role: "primary" },
    { rankingKey: "starting-salary-university", shortLabel: "大卒初任給", role: "secondary" },
    { rankingKey: "starting-salary-highschool", shortLabel: "高卒初任給", role: "context" },
    { rankingKey: "scheduled-salary-male", shortLabel: "所定内給与(男)", role: "context" },
    { rankingKey: "nurse-salary", shortLabel: "看護師年収", role: "secondary" },
    // 雇用
    { rankingKey: "active-job-opening-ratio", shortLabel: "有効求人倍率", role: "secondary" },
    { rankingKey: "unemployment-rate", shortLabel: "失業率", role: "secondary" },
    { rankingKey: "employment-rate", shortLabel: "就業率", role: "context" },
    { rankingKey: "employed-people-ratio", shortLabel: "有業率", role: "context" },
    // 働き方
    { rankingKey: "telework-rate", shortLabel: "テレワーク率", role: "secondary" },
    { rankingKey: "side-job-rate", shortLabel: "副業率", role: "context" },
    { rankingKey: "monthly-average-actual-working-hours-male", shortLabel: "月間労働時間(男)", role: "context" },
    { rankingKey: "turnover-rate", shortLabel: "離職率", role: "context" },
  ],
  keywords: [
    "最低賃金",
    "初任給",
    "有効求人倍率",
    "失業率",
    "都道府県",
    "ランキング",
  ],
};
