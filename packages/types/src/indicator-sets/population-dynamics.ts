// AUTO-GENERATED — DO NOT EDIT.
// Source of truth: packages/data-configs/src/theme-catalog/population-dynamics.ts
// Regenerate: npm run generate:catalog --workspace=@stats47/data-configs
import type { IndicatorSet } from "../indicator-set";

export const POPULATION_DYNAMICS_SET: IndicatorSet = {
  "key": "population-dynamics",
  "title": "人口動態",
  "description": "人口はどれだけ変わり、その変化は出生・死亡と転入・転出のどちらで生じているかを把握する。",
  "category": "demographics",
  "usage": "theme",
  "metrics": [
    {
      "rankingKey": "total-population",
      "shortLabel": "総人口",
      "role": "secondary"
    },
    {
      "rankingKey": "total-fertility-rate",
      "shortLabel": "合計特殊出生率",
      "role": "secondary"
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
      "shortLabel": "人口密度（可住地1km²当たり）",
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
      "role": "secondary"
    },
    {
      "rankingKey": "death-count",
      "shortLabel": "死亡数",
      "role": "context"
    },
    {
      "rankingKey": "movers-in",
      "shortLabel": "外国人転入者数",
      "role": "secondary"
    },
    {
      "rankingKey": "movers-out",
      "shortLabel": "外国人転出者数",
      "role": "secondary"
    },
    {
      "rankingKey": "interprefecture-net-migration-age15to24",
      "shortLabel": "15〜24歳の県間転入超過数",
      "role": "secondary"
    },
    {
      "rankingKey": "interprefecture-net-migration-age25to34",
      "shortLabel": "25〜34歳の県間転入超過数",
      "role": "secondary"
    },
    {
      "rankingKey": "high-school-graduates-out-of-prefecture-job-ratio",
      "shortLabel": "高校卒業就職者のうち県外就職者の割合",
      "role": "secondary"
    },
    {
      "rankingKey": "high-school-advancement-rate",
      "shortLabel": "高等学校卒業者の進学率",
      "role": "secondary"
    },
    {
      "rankingKey": "births-mother-under25",
      "shortLabel": "母が25歳未満の出生数",
      "role": "secondary"
    },
    {
      "rankingKey": "births-mother-age25to29",
      "shortLabel": "母が25〜29歳の出生数",
      "role": "secondary"
    },
    {
      "rankingKey": "births-mother-age30to34",
      "shortLabel": "母が30〜34歳の出生数",
      "role": "secondary"
    },
    {
      "rankingKey": "births-mother-age35to39",
      "shortLabel": "母が35〜39歳の出生数",
      "role": "secondary"
    },
    {
      "rankingKey": "births-mother-age40plus",
      "shortLabel": "母が40歳以上の出生数",
      "role": "secondary"
    },
    {
      "rankingKey": "births-first-child",
      "shortLabel": "第1子の出生数",
      "role": "secondary"
    },
    {
      "rankingKey": "births-second-child",
      "shortLabel": "第2子の出生数",
      "role": "secondary"
    },
    {
      "rankingKey": "births-third-child-plus",
      "shortLabel": "第3子以降の出生数",
      "role": "secondary"
    },
    {
      "rankingKey": "five-year-residence-same-address",
      "shortLabel": "5年前と同じ住所に住む5歳以上人口",
      "role": "secondary"
    },
    {
      "rankingKey": "five-year-residence-other-prefecture",
      "shortLabel": "5年前は他県に住んでいた5歳以上人口",
      "role": "secondary"
    },
    {
      "rankingKey": "future-population",
      "shortLabel": "将来推計人口",
      "role": "secondary"
    },
    {
      "rankingKey": "future-population-change-rate-2050",
      "shortLabel": "2020～2050年の人口増減率（推計）",
      "role": "secondary"
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
