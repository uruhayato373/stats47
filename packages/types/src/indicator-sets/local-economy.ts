// AUTO-GENERATED — DO NOT EDIT.
// Source of truth: packages/data-configs/src/theme-catalog/local-economy.ts
// Regenerate: npm run generate:catalog --workspace=@stats47/data-configs
import type { IndicatorSet } from "../indicator-set";

export const LOCAL_ECONOMY_SET: IndicatorSet = {
  "key": "local-economy",
  "title": "地域経済",
  "description": "県民所得、納税者の所得、産業別就業者構成、農業産出額から、地域の所得形成と生産基盤を比較します。",
  "category": "economy",
  "usage": "theme",
  "metrics": [
    {
      "rankingKey": "per-taxpayer-taxable-income",
      "shortLabel": "課税対象所得（納税義務者1人当たり）",
      "role": "secondary"
    },
    {
      "rankingKey": "per-capita-prefectural-income-h27",
      "shortLabel": "1人当たり県民所得",
      "role": "primary"
    },
    {
      "rankingKey": "minimum-wage-by-region",
      "shortLabel": "最低賃金",
      "role": "context"
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
      "rankingKey": "fiscal-strength-index-prefecture",
      "shortLabel": "財政力指数",
      "role": "context"
    },
    {
      "rankingKey": "employed-people-ratio-primary",
      "shortLabel": "第1次産業就業者比率",
      "role": "secondary"
    },
    {
      "rankingKey": "employed-people-ratio-secondary",
      "shortLabel": "第2次産業就業者比率",
      "role": "secondary"
    },
    {
      "rankingKey": "employed-people-ratio-tertiary",
      "shortLabel": "第3次産業就業者比率",
      "role": "secondary"
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
    },
    {
      "rankingKey": "agricultural-output",
      "shortLabel": "農業産出額",
      "role": "secondary"
    },
    {
      "rankingKey": "annual-sales-amount",
      "shortLabel": "商業年間商品販売額",
      "role": "secondary"
    },
    {
      "rankingKey": "annual-sales-amount-per-employee",
      "shortLabel": "従業者1人当たり商業販売額",
      "role": "secondary"
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
