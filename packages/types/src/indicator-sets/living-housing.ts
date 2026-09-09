// AUTO-GENERATED — DO NOT EDIT.
// Source of truth: packages/data-configs/src/theme-catalog/living-housing.ts
// Regenerate: npm run generate:catalog --workspace=@stats47/data-configs
import type { IndicatorSet } from "../indicator-set";

export const LIVING_HOUSING_SET: IndicatorSet = {
  "key": "living-housing",
  "title": "暮らし・住まい",
  "description": "住宅ストックの余り方・所有形態・住戸の広さと、住む世帯の形を比較する。",
  "category": "lifestyle",
  "usage": "theme",
  "metrics": [
    {
      "rankingKey": "vacant-housing-ratio",
      "shortLabel": "空き家率",
      "role": "primary"
    },
    {
      "rankingKey": "owner-occupied-housing-ratio",
      "shortLabel": "持ち家率",
      "role": "secondary"
    },
    {
      "rankingKey": "floor-area-per-dwelling-owner",
      "shortLabel": "持ち家延べ面積（1住宅当たり）",
      "role": "secondary"
    },
    {
      "rankingKey": "floor-area-per-dwelling-rented",
      "shortLabel": "借家延べ面積（1住宅当たり）",
      "role": "secondary"
    },
    {
      "rankingKey": "households",
      "shortLabel": "世帯数",
      "role": "context"
    },
    {
      "rankingKey": "nuclear-family-households-ratio",
      "shortLabel": "核家族世帯率",
      "role": "secondary"
    },
    {
      "rankingKey": "elderly-couple-only-household-ratio",
      "shortLabel": "高齢夫婦世帯",
      "role": "context"
    },
    {
      "rankingKey": "single-person-household-old-population-ratio",
      "shortLabel": "高齢単独世帯（一般世帯に対して）",
      "role": "context"
    },
    {
      "rankingKey": "population-density-per-km2-inhabitable-area",
      "shortLabel": "人口密度（可住地1km²当たり）",
      "role": "context"
    },
    {
      "rankingKey": "habitable-area-ratio",
      "shortLabel": "可住地面積割合",
      "role": "context"
    },
    {
      "rankingKey": "densely-inhabited-district-population-density",
      "shortLabel": "DID人口密度（DID面積1km²当たり）",
      "role": "context"
    },
    {
      "rankingKey": "ratio-never-married-15-plus",
      "shortLabel": "未婚率",
      "role": "context"
    },
    {
      "rankingKey": "marriages",
      "shortLabel": "婚姻件数",
      "role": "context"
    },
    {
      "rankingKey": "divorces",
      "shortLabel": "離婚件数",
      "role": "context"
    },
    {
      "rankingKey": "single-person-household-ratio",
      "shortLabel": "単独世帯割合",
      "role": "secondary"
    },
    {
      "rankingKey": "household-ratio-above-minimum-housing-area",
      "shortLabel": "最低居住面積水準以上の世帯割合",
      "role": "secondary"
    },
    {
      "rankingKey": "new-housing-starts",
      "shortLabel": "着工新設住宅戸数",
      "role": "secondary"
    },
    {
      "rankingKey": "renovation-rate",
      "shortLabel": "リフォーム工事実施率",
      "role": "secondary"
    },
    {
      "rankingKey": "earthquake-renovation-rate",
      "shortLabel": "耐震改修工事実施率",
      "role": "secondary"
    },
    {
      "rankingKey": "vacant-housing-rate",
      "shortLabel": "空き家率",
      "role": "secondary"
    },
    {
      "rankingKey": "average-persons-per-general-household",
      "shortLabel": "一般世帯の平均人員",
      "role": "secondary"
    },
    {
      "rankingKey": "private-rent-consumption-expenditure",
      "shortLabel": "家賃支出",
      "role": "secondary"
    },
    {
      "rankingKey": "current-liabilities-balance-multi-person-households-per-household",
      "shortLabel": "負債現在高",
      "role": "secondary"
    },
    {
      "rankingKey": "urban-parks",
      "shortLabel": "都市公園数",
      "role": "secondary"
    },
    {
      "rankingKey": "urban-parks-area",
      "shortLabel": "都市公園面積",
      "role": "secondary"
    }
  ],
  "keywords": [
    "空き家",
    "持ち家",
    "人口密度",
    "世帯構造",
    "未婚率",
    "都道府県",
    "ランキング"
  ]
};
