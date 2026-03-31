import type { IndicatorSet } from "../indicator-set";

export const LOCAL_ECONOMY_SET: IndicatorSet = {
  key: "local-economy",
  title: "地域経済",
  description:
    "都道府県別のGDP・県民所得・産業構造・雇用・財政を地図とランキングで比較。県内総生産、有効求人倍率、製造品出荷額、財政力指数など主要経済指標の推移を47都道府県のデータで確認できます。",
  category: "economy",
  usage: "theme",
  indicators: [
    { rankingKey: "per-taxpayer-taxable-income", shortLabel: "課税所得", role: "primary" },
    { rankingKey: "prefectural-income-per-capita", shortLabel: "1人当たり県民所得", role: "secondary" },
    { rankingKey: "minimum-wage-by-region", shortLabel: "最低賃金", role: "secondary" },
    { rankingKey: "active-job-opening-ratio", shortLabel: "有効求人倍率", role: "secondary" },
    { rankingKey: "unemployment-rate", shortLabel: "失業率", role: "secondary" },
    { rankingKey: "fiscal-strength-index-prefecture", shortLabel: "財政力指数", role: "secondary" },
  ],
  panelTabs: [
    {
      label: "GDP・所得",
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
    {
      label: "産業",
      rankingKeys: [],
    },
    {
      label: "財政・地価",
      rankingKeys: [
        "fiscal-strength-index-prefecture",
      ],
    },
  ],
  keywords: [
    "地域経済",
    "県内総生産",
    "GDP",
    "県民所得",
    "課税所得",
    "産業構造",
    "就業者",
    "失業率",
    "有効求人倍率",
    "製造品出荷額",
    "財政力指数",
    "都道府県",
    "ランキング",
  ],
};
