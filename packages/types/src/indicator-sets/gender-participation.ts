// AUTO-GENERATED — DO NOT EDIT.
// Source of truth: packages/data-configs/src/theme-catalog/gender-participation.ts
// Regenerate: npm run generate:catalog --workspace=@stats47/data-configs
import type { IndicatorSet } from "../indicator-set";

export const GENDER_PARTICIPATION_SET: IndicatorSet = {
  "key": "gender-participation",
  "title": "地域の男女共同参画",
  "description": "男女間賃金格差、女性・男性の労働力人口比率、女性パートタイム賃金を別軸で比較します。賃金格差から管理職比率を推定しません。",
  "category": "economy",
  "usage": "theme",
  "metrics": [
    {
      "rankingKey": "gender-wage-gap",
      "shortLabel": "男女間賃金格差",
      "role": "primary"
    },
    {
      "rankingKey": "labor-force-population-ratio-woman",
      "shortLabel": "女性労働力人口比率",
      "role": "secondary"
    },
    {
      "rankingKey": "labor-force-population-ratio-man",
      "shortLabel": "男性労働力人口比率",
      "role": "secondary"
    },
    {
      "rankingKey": "female-part-time-hourly-wage",
      "shortLabel": "女性パートタイム給与",
      "role": "secondary"
    }
  ],
  "keywords": [
    "男女共同参画",
    "女性就業",
    "賃金格差"
  ]
};
