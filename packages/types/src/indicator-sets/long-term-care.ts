// AUTO-GENERATED — DO NOT EDIT.
// Source of truth: packages/data-configs/src/theme-catalog/long-term-care.ts
// Regenerate: npm run generate:catalog --workspace=@stats47/data-configs
import type { IndicatorSet } from "../indicator-set";

export const LONG_TERM_CARE_SET: IndicatorSet = {
  "key": "long-term-care",
  "title": "介護認定とサービスの需給",
  "description": "2024年度末の要支援・要介護認定者総数と、介護保険給付・老人ホームの供給を比較します。認定者数は保険者報告の県別集計で、サービス利用人数や人口当たり認定率ではありません。異なる年の給付や施設数との単純な割り算は行いません。",
  "category": "welfare",
  "usage": "theme",
  "metrics": [
    {
      "rankingKey": "long-term-care-certified-persons",
      "shortLabel": "要支援・要介護認定者数（2024年度末）",
      "role": "primary"
    },
    {
      "rankingKey": "nursing-care-insurance-benefit",
      "shortLabel": "介護保険給付費用額",
      "role": "primary"
    },
    {
      "rankingKey": "nursing-home-count-per-100k-65plus",
      "shortLabel": "老人ホーム数（65歳以上人口10万人当たり）",
      "role": "secondary"
    },
    {
      "rankingKey": "nursing-home-capacity-per-1000-65plus",
      "shortLabel": "老人ホーム定員数（65歳以上人口千人当たり）",
      "role": "secondary"
    },
    {
      "rankingKey": "nursing-home-residents-per-1000-65plus",
      "shortLabel": "老人ホーム在所者数（65歳以上人口千人当たり）",
      "role": "secondary"
    }
  ],
  "keywords": [
    "介護",
    "介護保険",
    "老人ホーム"
  ]
};
