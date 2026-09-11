// AUTO-GENERATED — DO NOT EDIT.
// Source of truth: packages/data-configs/src/theme-catalog/communication-access.ts
// Regenerate: npm run generate:catalog --workspace=@stats47/data-configs
import type { IndicatorSet } from "../indicator-set";

export const COMMUNICATION_ACCESS_SET: IndicatorSet = {
  "key": "communication-access",
  "title": "通信環境とデジタル基盤",
  "description": "ブロードバンド契約数と携帯電話の契約・保有を比較します。ブロードバンドはBWAを含み、携帯電話アクセスを含む旧系列と除く系列を別々に表示します。契約数は世帯普及率や通信速度とは異なります。",
  "category": "industry",
  "usage": "theme",
  "metrics": [
    {
      "rankingKey": "broadband-contract-count-excluding-39-4g",
      "shortLabel": "ブロードバンド契約数（3.9〜4世代携帯電話アクセスを除く）",
      "role": "primary"
    },
    {
      "rankingKey": "broadband-service-contract-count",
      "shortLabel": "ブロードバンド契約数（携帯電話アクセスを含む旧系列）",
      "role": "secondary"
    },
    {
      "rankingKey": "mobile-phone-contract-count-per-1000",
      "shortLabel": "携帯電話契約数（人口千人当たり）",
      "role": "secondary"
    },
    {
      "rankingKey": "mobile-phone-ownership-multi-person-households-per-1000",
      "shortLabel": "携帯電話所有数量（二人以上世帯千世帯当たり）",
      "role": "secondary"
    }
  ],
  "keywords": [
    "通信",
    "ブロードバンド",
    "携帯電話",
    "インターネット"
  ]
};
