import type { IndicatorSet } from "../indicator-set";

export const POPULATION_DYNAMICS_SET: IndicatorSet = {
  key: "population-dynamics",
  title: "人口動態",
  description:
    "都道府県別の出生率・死亡率・高齢化率・転入超過率を地図・チャート・ランキングで比較。人口ピラミッド・年齢構成・自然増減率など11指標の推移を47都道府県で確認できます。",
  category: "demographics",
  usage: "theme",
  indicators: [
    { rankingKey: "crude-birth-rate", shortLabel: "粗出生率", role: "primary" },
    { rankingKey: "total-fertility-rate", shortLabel: "合計特殊出生率", role: "secondary" },
    { rankingKey: "crude-death-rate", shortLabel: "死亡率", role: "secondary" },
    { rankingKey: "natural-increase-rate", shortLabel: "自然増減率", role: "secondary" },
    { rankingKey: "social-increase-rate", shortLabel: "社会増減率", role: "secondary" },
    { rankingKey: "moving-in-excess-rate", shortLabel: "転入超過率", role: "secondary" },
    { rankingKey: "ratio-65-plus", shortLabel: "高齢化率", role: "secondary" },
    { rankingKey: "young-population-ratio", shortLabel: "年少人口割合", role: "secondary" },
    { rankingKey: "population-density-per-km2-inhabitable-area", shortLabel: "人口密度", role: "secondary" },
    { rankingKey: "day-time-population-ratio", shortLabel: "昼夜間人口比率", role: "secondary" },
    { rankingKey: "total-population", shortLabel: "総人口", role: "context" },
  ],
  panelTabs: [
    {
      label: "出生・死亡",
      rankingKeys: [
        "crude-birth-rate",
        "total-fertility-rate",
        "crude-death-rate",
        "natural-increase-rate",
      ],
    },
    {
      label: "移動",
      rankingKeys: [
        "social-increase-rate",
        "moving-in-excess-rate",
        "day-time-population-ratio",
      ],
    },
    {
      label: "構造",
      rankingKeys: [
        "ratio-65-plus",
        "young-population-ratio",
        "population-density-per-km2-inhabitable-area",
        "total-population",
      ],
    },
  ],
  keywords: [
    "人口動態",
    "人口増減率",
    "自然増減率",
    "社会増減率",
    "高齢化率",
    "出生率",
    "死亡率",
    "転入超過",
    "都道府県",
    "ランキング",
  ],
};
