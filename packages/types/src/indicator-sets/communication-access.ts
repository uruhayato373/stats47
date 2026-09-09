// AUTO-GENERATED — DO NOT EDIT.
// Source of truth: packages/data-configs/src/theme-catalog/communication-access.ts
// Regenerate: npm run generate:catalog --workspace=@stats47/data-configs
import type { IndicatorSet } from "../indicator-set";

export const COMMUNICATION_ACCESS_SET: IndicatorSet = {
  "key": "communication-access",
  "title": "通信環境とデジタル基盤",
  "description": "携帯電話契約数・保有数量、インターネット接続料、情報通信係数を掲載します。契約数は実利用や通信速度を意味しません。",
  "category": "industry",
  "usage": "theme",
  "metrics": [
    {
      "rankingKey": "mobile-phone-contract-count-per-1000",
      "shortLabel": "携帯電話契約数",
      "role": "primary"
    },
    {
      "rankingKey": "mobile-phone-ownership-multi-person-households-per-1000",
      "shortLabel": "携帯電話所有数量",
      "role": "secondary"
    },
    {
      "rankingKey": "internet-fee-consumption-expenditure",
      "shortLabel": "インターネット接続料",
      "role": "secondary"
    },
    {
      "rankingKey": "information-communication-coefficient",
      "shortLabel": "情報通信係数",
      "role": "secondary"
    }
  ],
  "keywords": [
    "通信",
    "携帯電話",
    "インターネット",
    "デジタル"
  ]
};
