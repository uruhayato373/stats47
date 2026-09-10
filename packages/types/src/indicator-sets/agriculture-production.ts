// AUTO-GENERATED — DO NOT EDIT.
// Source of truth: packages/data-configs/src/theme-catalog/agriculture-production.ts
// Regenerate: npm run generate:catalog --workspace=@stats47/data-configs
import type { IndicatorSet } from "../indicator-set";

export const AGRICULTURE_PRODUCTION_SET: IndicatorSet = {
  "key": "agriculture-production",
  "title": "農業の生産力",
  "description": "農業産出額、農家数、基幹的農業従事者を別々の指標として比較します。総額は人口規模の影響を受けるため、1人当たり指標と混同しません。",
  "category": "industry",
  "usage": "theme",
  "metrics": [
    {
      "rankingKey": "agricultural-output",
      "shortLabel": "農業産出額",
      "role": "primary"
    },
    {
      "rankingKey": "agricultural-output-per-employed-person",
      "shortLabel": "農業就業者1人当たり農業産出額",
      "role": "secondary"
    },
    {
      "rankingKey": "agricultural-farm-count",
      "shortLabel": "農家数",
      "role": "secondary"
    },
    {
      "rankingKey": "core-agricultural-workers",
      "shortLabel": "基幹的農業従事者数（販売農家）",
      "role": "secondary"
    },
    {
      "rankingKey": "cultivated-area",
      "shortLabel": "耕地面積",
      "role": "secondary"
    },
    {
      "rankingKey": "raw-milk-production",
      "shortLabel": "年間生乳生産量（t）",
      "role": "secondary"
    },
    {
      "rankingKey": "dairy-cattle-count",
      "shortLabel": "乳用牛飼養頭数",
      "role": "secondary"
    },
    {
      "rankingKey": "dairy-cattle-holdings",
      "shortLabel": "乳用牛の飼養戸数",
      "role": "secondary"
    },
    {
      "rankingKey": "beef-cattle-count",
      "shortLabel": "肉用牛飼養頭数",
      "role": "secondary"
    },
    {
      "rankingKey": "pig-count",
      "shortLabel": "豚飼養頭数",
      "role": "secondary"
    },
    {
      "rankingKey": "layer-hen-count",
      "shortLabel": "採卵鶏の成鶏めす（千羽）",
      "role": "secondary"
    }
  ],
  "keywords": [
    "農業",
    "農業産出額",
    "農家"
  ]
};
