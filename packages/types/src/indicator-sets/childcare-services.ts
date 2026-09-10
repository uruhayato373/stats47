// AUTO-GENERATED — DO NOT EDIT.
// Source of truth: packages/data-configs/src/theme-catalog/childcare-services.ts
// Regenerate: npm run generate:catalog --workspace=@stats47/data-configs
import type { IndicatorSet } from "../indicator-set";

export const CHILDCARE_SERVICES_SET: IndicatorSet = {
  "key": "childcare-services",
  "title": "保育の需給",
  "description": "保育所等の数・在所児・利用率と認定こども園数に加え、2025年4月1日の保育所等利用申込者数を比較します。申込者には利用中の児童も含まれます。指標によって対象年や集計範囲が異なるため、申込者と別の指標の定員を差し引いて待機児童数とはしません。",
  "category": "education",
  "usage": "theme",
  "metrics": [
    {
      "rankingKey": "nursery-count-per-100k-0-5",
      "shortLabel": "保育所等数（0～5歳人口10万人当たり）",
      "role": "primary"
    },
    {
      "rankingKey": "nursery-children-per-nursery-teacher",
      "shortLabel": "保育所等在所児数（保育士1人当たり）",
      "role": "secondary"
    },
    {
      "rankingKey": "nursery-utilization-rate",
      "shortLabel": "保育所等利用率（在所児数／定員数）",
      "role": "secondary"
    },
    {
      "rankingKey": "certified-childcare-center-count-per-100k-0-5",
      "shortLabel": "認定こども園数（0～5歳人口10万人当たり）",
      "role": "secondary"
    },
    {
      "rankingKey": "childcare-applicants",
      "shortLabel": "保育所等利用申込者数（4月1日時点）",
      "role": "secondary"
    }
  ],
  "keywords": [
    "保育",
    "保育所",
    "待機児童",
    "こども園"
  ]
};
