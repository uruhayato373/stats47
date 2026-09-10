// AUTO-GENERATED — DO NOT EDIT.
// Source of truth: packages/data-configs/src/theme-catalog/information-industry.ts
// Regenerate: npm run generate:catalog --workspace=@stats47/data-configs
import type { IndicatorSet } from "../indicator-set";

export const INFORMATION_INDUSTRY_SET: IndicatorSet = {
  "key": "information-industry",
  "title": "情報通信業",
  "description": "情報通信業の事業所・従業者と、県内総生産を比較します。事業所統計は2021年6月1日、県内総生産は同じ2015年基準の2011〜2021年度で、対象期間と定義を分けて読みます。",
  "category": "economy",
  "usage": "theme",
  "metrics": [
    {
      "rankingKey": "information-private-establishments",
      "shortLabel": "事業所数",
      "role": "primary"
    },
    {
      "rankingKey": "information-private-employees",
      "shortLabel": "従業者数",
      "role": "secondary"
    },
    {
      "rankingKey": "gross-prefectural-product-information-communication-h27",
      "shortLabel": "県内総生産（名目・2015年基準）",
      "role": "secondary"
    }
  ],
  "keywords": [
    "情報通信業",
    "経済センサス",
    "事業所数",
    "従業者数"
  ]
};
