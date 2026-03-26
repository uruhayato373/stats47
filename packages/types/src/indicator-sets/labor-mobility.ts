import type { IndicatorSet } from "../indicator-set";

export const LABOR_MOBILITY_SET: IndicatorSet = {
  key: "labor-mobility",
  title: "人材流動性・雇用環境",
  description:
    "都道府県別の離職率・転職率・有効求人倍率・テレワーク率から雇用の流動性を比較。47都道府県の労働市場タイプを可視化します。",
  category: "economy",
  usage: "theme",
  indicators: [
    // 流動性
    { rankingKey: "turnover-rate", shortLabel: "離職率", role: "primary" },
    { rankingKey: "job-change-rate", shortLabel: "転職率", role: "secondary" },
    // 雇用環境
    { rankingKey: "active-job-opening-ratio", shortLabel: "有効求人倍率", role: "secondary" },
    { rankingKey: "unemployment-rate", shortLabel: "失業率", role: "secondary" },
    { rankingKey: "employment-rate", shortLabel: "就業率", role: "context" },
    // 働き方
    { rankingKey: "telework-rate", shortLabel: "テレワーク率", role: "secondary" },
    { rankingKey: "side-job-rate", shortLabel: "副業率", role: "context" },
    { rankingKey: "monthly-average-actual-working-hours-male", shortLabel: "月間労働時間(男)", role: "context" },
  ],
  panelTabs: [
    {
      label: "流動性",
      rankingKeys: [
        "turnover-rate",
        "job-change-rate",
      ],
    },
    {
      label: "雇用環境",
      rankingKeys: [
        "active-job-opening-ratio",
        "unemployment-rate",
        "employment-rate",
      ],
    },
    {
      label: "働き方",
      rankingKeys: [
        "telework-rate",
        "side-job-rate",
        "monthly-average-actual-working-hours-male",
      ],
    },
  ],
  keywords: [
    "離職率",
    "転職率",
    "有効求人倍率",
    "テレワーク",
    "人材流動性",
    "都道府県",
    "ランキング",
  ],
};
