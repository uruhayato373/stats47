// AUTO-GENERATED — DO NOT EDIT.
// Source of truth: packages/data-configs/src/theme-catalog/local-government-digital.ts
// Regenerate: npm run generate:catalog --workspace=@stats47/data-configs
import type { IndicatorSet } from "../indicator-set";

export const LOCAL_GOVERNMENT_DIGITAL_SET: IndicatorSet = {
  "key": "local-government-digital",
  "title": "自治体DX",
  "description": "自治体のオンライン手続きに関する公式系列を追加する前段として、行政サービスに関連する事業所・情報通信基盤を掲載します。申請率を未取得データから推定しません。",
  "category": "finance",
  "usage": "theme",
  "metrics": [
    {
      "rankingKey": "information-communication-coefficient",
      "shortLabel": "情報通信係数",
      "role": "primary"
    },
    {
      "rankingKey": "number-of-establishments-information-communication",
      "shortLabel": "情報通信業事業所数",
      "role": "secondary"
    },
    {
      "rankingKey": "information-communication-expenditure",
      "shortLabel": "情報通信関係費",
      "role": "secondary"
    }
  ],
  "keywords": [
    "自治体DX",
    "オンライン申請",
    "行政",
    "デジタル"
  ]
};
