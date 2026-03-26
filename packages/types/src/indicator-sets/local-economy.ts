import type { IndicatorSet } from "../indicator-set";

export const LOCAL_ECONOMY_SET: IndicatorSet = {
  key: "local-economy",
  title: "地域経済",
  description:
    "都道府県別の課税所得・産業別就業者比率・完全失業率・昼夜間人口比率を地図とランキングで比較。地域経済の実態を47都道府県のデータで確認できます。",
  category: "economy",
  usage: "theme",
  indicators: [
    { rankingKey: "per-taxpayer-taxable-income", shortLabel: "課税所得", role: "primary" },
    { rankingKey: "minimum-wage-by-region", shortLabel: "最低賃金", role: "secondary" },
    { rankingKey: "active-job-opening-ratio", shortLabel: "有効求人倍率", role: "secondary" },
    { rankingKey: "unemployment-rate", shortLabel: "失業率", role: "secondary" },
  ],
  panelTabs: [
    {
      label: "所得",
      rankingKeys: [
        "per-taxpayer-taxable-income",
        "minimum-wage-by-region",
      ],
    },
    {
      label: "雇用",
      rankingKeys: [
        "active-job-opening-ratio",
        "unemployment-rate",
      ],
    },
  ],
  keywords: [
    "課税所得",
    "産業構造",
    "就業者",
    "失業率",
    "商業",
    "都道府県",
    "ランキング",
  ],
};
