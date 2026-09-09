// AUTO-GENERATED — DO NOT EDIT.
// Source of truth: packages/data-configs/src/theme-catalog/tsunami-exposure.ts
// Regenerate: npm run generate:catalog --workspace=@stats47/data-configs
import type { IndicatorSet } from "../indicator-set";

export const TSUNAMI_EXPOSURE_SET: IndicatorSet = {
  "key": "tsunami-exposure",
  "title": "津波と沿岸防災",
  "description": "沿岸県の災害被害額と復旧費、漁港の数を基礎情報として掲載します。浸水想定面積・深さ別人口・避難施設は想定地震と公表年を固定した沿岸GIS計算後に追加し、内陸県をゼロ扱いしません。",
  "category": "safety",
  "usage": "theme",
  "metrics": [
    {
      "rankingKey": "disaster-damage-amount",
      "shortLabel": "災害被害額",
      "role": "primary"
    },
    {
      "rankingKey": "disaster-recovery-expenses-prefecture",
      "shortLabel": "災害復旧費",
      "role": "secondary"
    },
    {
      "rankingKey": "fishing-port-count-ksj",
      "shortLabel": "漁港数",
      "role": "secondary"
    }
  ],
  "keywords": [
    "津波",
    "沿岸防災",
    "浸水",
    "避難"
  ]
};
