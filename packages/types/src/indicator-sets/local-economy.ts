// AUTO-GENERATED — DO NOT EDIT.
// Source of truth: packages/data-configs/src/theme-catalog/local-economy.ts
// Regenerate: npm run generate:catalog --workspace=@stats47/data-configs
import type { IndicatorSet } from "../indicator-set";

export const LOCAL_ECONOMY_SET: IndicatorSet = {
  "key": "local-economy",
  "title": "地域経済",
  "description": "都道府県別のGDP・県民所得・産業構造・雇用・財政をランキングとチャートで比較。県内総生産、有効求人倍率、製造品出荷額、財政力指数など主要経済指標の推移を47都道府県のデータで確認できます。",
  "category": "economy",
  "usage": "theme",
  "metrics": [
    {
      "rankingKey": "per-taxpayer-taxable-income",
      "shortLabel": "課税所得",
      "role": "primary"
    },
    {
      "rankingKey": "per-capita-prefectural-income-h27",
      "shortLabel": "1人当たり県民所得",
      "role": "secondary"
    },
    {
      "rankingKey": "minimum-wage-by-region",
      "shortLabel": "最低賃金",
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
      "rankingKey": "fiscal-strength-index-prefecture",
      "shortLabel": "財政力指数",
      "role": "secondary"
    },
    {
      "rankingKey": "employed-people-ratio-primary",
      "shortLabel": "第1次産業就業者比率",
      "role": "context"
    },
    {
      "rankingKey": "employed-people-ratio-secondary",
      "shortLabel": "第2次産業就業者比率",
      "role": "context"
    },
    {
      "rankingKey": "employed-people-ratio-tertiary",
      "shortLabel": "第3次産業就業者比率",
      "role": "context"
    },
    {
      "rankingKey": "disposable-income-worker-households",
      "shortLabel": "可処分所得（二人以上の世帯のうち勤労者世帯）",
      "role": "context"
    },
    {
      "rankingKey": "number-of-establishments-economic-census-basic-survey",
      "shortLabel": "事業所数",
      "role": "context"
    }
  ],
  "keywords": [
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
    "ランキング"
  ]
};
