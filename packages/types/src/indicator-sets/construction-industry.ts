// AUTO-GENERATED — DO NOT EDIT.
// Source of truth: packages/data-configs/src/theme-catalog/construction-industry.ts
// Regenerate: npm run generate:catalog --workspace=@stats47/data-configs
import type { IndicatorSet } from "../indicator-set";

export const CONSTRUCTION_INDUSTRY_SET: IndicatorSet = {
  "key": "construction-industry",
  "title": "建設業",
  "description": "建設業の完成工事高・許可業者数と、民営事業所で働く従業者数を都道府県別に比較します。工事の取引段階と統計の対象年を分けて確認できます。",
  "category": "economy",
  "usage": "theme",
  "metrics": [
    {
      "rankingKey": "prime-contractor-completed-construction",
      "shortLabel": "元請完成工事高",
      "role": "primary"
    },
    {
      "rankingKey": "construction-industry-count",
      "shortLabel": "許可業者数",
      "role": "secondary"
    },
    {
      "rankingKey": "subcontractor-completed-construction",
      "shortLabel": "下請完成工事高",
      "role": "context"
    },
    {
      "rankingKey": "construction-private-employees",
      "shortLabel": "従業者数",
      "role": "secondary"
    },
    {
      "rankingKey": "construction-employed-residents",
      "shortLabel": "建設業就業者総数（常住地別）",
      "role": "secondary"
    },
    {
      "rankingKey": "construction-employed-under30",
      "shortLabel": "30歳未満の建設業就業者",
      "role": "secondary"
    },
    {
      "rankingKey": "construction-employed-age30to54",
      "shortLabel": "30〜54歳の建設業就業者",
      "role": "secondary"
    },
    {
      "rankingKey": "construction-employed-age55plus",
      "shortLabel": "55歳以上の建設業就業者",
      "role": "secondary"
    },
    {
      "rankingKey": "construction-employed-female",
      "shortLabel": "女性の建設業就業者",
      "role": "secondary"
    },
    {
      "rankingKey": "architect-annual-income",
      "shortLabel": "建築技術者の推計年収（2022年）",
      "role": "secondary"
    },
    {
      "rankingKey": "public-construction-contract-count",
      "shortLabel": "公共工事の請負契約件数（施工地別）",
      "role": "secondary"
    },
    {
      "rankingKey": "public-construction-contract-amount",
      "shortLabel": "公共工事の請負契約額（施工地別）",
      "role": "secondary"
    }
  ],
  "keywords": [
    "建設業",
    "完成工事高",
    "許可業者数",
    "従業者数"
  ]
};
