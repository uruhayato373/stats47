// AUTO-GENERATED — DO NOT EDIT.
// Source of truth: packages/data-configs/src/theme-catalog/population-dynamics.ts
// Regenerate: npm run generate:catalog --workspace=@stats47/data-configs
import type { IndicatorSet } from "../indicator-set";

export const POPULATION_DYNAMICS_SET: IndicatorSet = {
  "key": "population-dynamics",
  "title": "人口動態",
  "description": "都道府県の人口増減を、増減率、出生・死亡、転入・転出、年齢構成の順に整理。結果と要因を分けて47都道府県で比較できます。",
  "category": "demographics",
  "usage": "theme",
  "metrics": [
    {
      "rankingKey": "total-population",
      "shortLabel": "総人口",
      "role": "context"
    },
    {
      "rankingKey": "total-fertility-rate",
      "shortLabel": "合計特殊出生率",
      "role": "context"
    },
    {
      "rankingKey": "moving-in-excess-rate",
      "shortLabel": "転入超過率",
      "role": "context"
    },
    {
      "rankingKey": "ratio-65-plus",
      "shortLabel": "高齢化率",
      "role": "context"
    },
    {
      "rankingKey": "population-growth-rate",
      "shortLabel": "人口増減率",
      "role": "primary"
    },
    {
      "rankingKey": "natural-increase-rate",
      "shortLabel": "自然増減率",
      "role": "secondary"
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
      "rankingKey": "social-increase-rate",
      "shortLabel": "社会増減率",
      "role": "context"
    },
    {
      "rankingKey": "young-population-ratio",
      "shortLabel": "年少人口割合",
      "role": "context"
    },
    {
      "rankingKey": "population-density-per-km2-inhabitable-area",
      "shortLabel": "人口密度",
      "role": "context"
    },
    {
      "rankingKey": "day-time-population-ratio",
      "shortLabel": "昼夜間人口比率",
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
      "rankingKey": "movers-in",
      "shortLabel": "転入者数",
      "role": "context"
    },
    {
      "rankingKey": "movers-out",
      "shortLabel": "転出者数",
      "role": "context"
    }
  ],
  "keywords": [
    "人口動態",
    "人口増減率",
    "自然増減率",
    "社会増減率",
    "高齢化率",
    "出生率",
    "死亡率",
    "転入超過",
    "都道府県",
    "ランキング"
  ]
};
