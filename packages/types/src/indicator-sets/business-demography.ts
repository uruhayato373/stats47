// AUTO-GENERATED — DO NOT EDIT.
// Source of truth: packages/data-configs/src/theme-catalog/business-demography.ts
// Regenerate: npm run generate:catalog --workspace=@stats47/data-configs
import type { IndicatorSet } from "../indicator-set";

export const BUSINESS_DEMOGRAPHY_SET: IndicatorSet = {
  "key": "business-demography",
  "title": "起業と開廃業",
  "description": "事業所の開設・廃止を直接表す公表系列が整うまで、経済センサスの事業所数と個人企業売上を基礎情報として掲載します。開業率・廃業率とは読み替えません。",
  "category": "economy",
  "usage": "theme",
  "metrics": [
    {
      "rankingKey": "number-of-establishments-economic-census-basic-survey",
      "shortLabel": "経済センサス事業所数",
      "role": "primary"
    },
    {
      "rankingKey": "sole-proprietor-sales",
      "shortLabel": "個人企業の売上高",
      "role": "secondary"
    },
    {
      "rankingKey": "sole-proprietor-sales-per-worker",
      "shortLabel": "個人企業の従業者1人当たり売上高",
      "role": "secondary"
    }
  ],
  "keywords": [
    "起業",
    "開業",
    "廃業",
    "事業所"
  ]
};
