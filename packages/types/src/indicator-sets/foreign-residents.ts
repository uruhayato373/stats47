// AUTO-GENERATED — DO NOT EDIT.
// Source of truth: packages/data-configs/src/theme-catalog/foreign-residents.ts
// Regenerate: npm run generate:catalog --workspace=@stats47/data-configs
import type { IndicatorSet } from "../indicator-set";

export const FOREIGN_RESIDENTS_SET: IndicatorSet = {
  "key": "foreign-residents",
  "title": "外国人",
  "description": "国勢調査の外国人人口を人口10万人当たりで比較し、国籍別の地域差を把握する。実人数は関連指標で確認できる。",
  "category": "demographics",
  "usage": "theme",
  "metrics": [
    {
      "rankingKey": "foreign-resident-count-per-100k",
      "shortLabel": "外国人人口（人口10万人当たり）",
      "role": "primary"
    },
    {
      "rankingKey": "foreign-resident-count",
      "shortLabel": "外国人数",
      "role": "context"
    },
    {
      "rankingKey": "resident-foreigner-population",
      "shortLabel": "在留外国人",
      "role": "context"
    },
    {
      "rankingKey": "foreign-resident-count-china-per-100k",
      "shortLabel": "中国籍人口（人口10万人当たり）",
      "role": "secondary"
    },
    {
      "rankingKey": "foreign-resident-count-china",
      "shortLabel": "中国(人数)",
      "role": "context"
    },
    {
      "rankingKey": "foreign-resident-count-korea-per-100k",
      "shortLabel": "韓国・朝鮮籍人口（人口10万人当たり）",
      "role": "secondary"
    },
    {
      "rankingKey": "foreign-resident-count-korea",
      "shortLabel": "韓国(人数)",
      "role": "context"
    },
    {
      "rankingKey": "foreign-resident-count-usa-per-100k",
      "shortLabel": "米国籍人口（人口10万人当たり）",
      "role": "context"
    },
    {
      "rankingKey": "foreign-resident-count-usa",
      "shortLabel": "米国(人数)",
      "role": "context"
    },
    {
      "rankingKey": "total-overnight-guests-foreign",
      "shortLabel": "外国人宿泊",
      "role": "context"
    }
  ],
  "keywords": [
    "外国人",
    "在留外国人",
    "外国人比率",
    "都道府県",
    "ランキング",
    "統計"
  ]
};
