// AUTO-GENERATED — DO NOT EDIT.
// Source of truth: packages/data-configs/src/theme-catalog/public-assistance.ts
// Regenerate: npm run generate:catalog --workspace=@stats47/data-configs
import type { IndicatorSet } from "../indicator-set";

export const PUBLIC_ASSISTANCE_SET: IndicatorSet = {
  "key": "public-assistance",
  "title": "生活保護と生活困窮",
  "description": "生活保護の受給状況・保護費と、生活困窮者自立支援の新規相談受付件数を分けて比較します。2024年4月〜2025年3月の新規受付。管内市区町村を含む都道府県枠に、同じ県の指定都市・中核市の別掲分を一度ずつ加算する。継続相談の延べ回数や困窮者・生活保護受給者の人数ではない。実施機関の管轄を県に集約し、相談者の居住県別人数とはしない。人口10万人当たりの月平均値は使用しない。",
  "category": "welfare",
  "usage": "theme",
  "metrics": [
    {
      "rankingKey": "poverty-support-new-consultation-cases",
      "shortLabel": "生活困窮者支援の新規相談受付件数",
      "role": "secondary"
    },
    {
      "rankingKey": "persons-on-public-assistance-per-1000",
      "shortLabel": "生活保護被保護実人員（月平均・人口千人当たり）",
      "role": "primary"
    },
    {
      "rankingKey": "households-on-public-assistance-per-1000",
      "shortLabel": "生活保護被保護実世帯数（月平均・一般世帯千世帯当たり）",
      "role": "secondary"
    },
    {
      "rankingKey": "public-assistance-expenses-prefecture",
      "shortLabel": "生活保護費（都道府県財政）",
      "role": "secondary"
    },
    {
      "rankingKey": "public-assistance-facility-capacity-per-1000",
      "shortLabel": "保護施設定員数（被保護実人員千人当たり）",
      "role": "secondary"
    }
  ],
  "keywords": [
    "生活保護",
    "生活困窮",
    "社会保障"
  ]
};
