// AUTO-GENERATED — DO NOT EDIT.
// Source of truth: packages/data-configs/src/theme-catalog/information-industry.ts
// Regenerate: npm run generate:catalog --workspace=@stats47/data-configs
import type { IndicatorSet } from "../indicator-set";

export const INFORMATION_INDUSTRY_SET: IndicatorSet = {
  "key": "information-industry",
  "title": "情報通信業",
  "description": "情報通信業の民営事業所数と従業者数を、2021年経済センサスの都道府県別データで比較します。事業所の立地と働く人の分布を確認できます。",
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
    }
  ],
  "keywords": [
    "情報通信業",
    "経済センサス",
    "事業所数",
    "従業者数"
  ]
};
