// AUTO-GENERATED — DO NOT EDIT.
// Source of truth: packages/data-configs/src/theme-catalog/environmental-quality.ts
// Regenerate: npm run generate:catalog --workspace=@stats47/data-configs
import type { IndicatorSet } from "../indicator-set";

export const ENVIRONMENTAL_QUALITY_SET: IndicatorSet = {
  "key": "environmental-quality",
  "title": "大気と水環境",
  "description": "公表済みの水質汚濁負荷量、公害苦情、特定事業場を掲載します。PM2.5や環境基準達成率は環境省の年次原典を都道府県集計した後に追加し、負荷量を濃度の代用にはしません。",
  "category": "safety",
  "usage": "theme",
  "metrics": [
    {
      "rankingKey": "ss-pollution-load",
      "shortLabel": "SS汚濁負荷量",
      "role": "primary"
    },
    {
      "rankingKey": "bod-pollution-load",
      "shortLabel": "BOD汚濁負荷量",
      "role": "secondary"
    },
    {
      "rankingKey": "cod-pollution-load",
      "shortLabel": "COD汚濁負荷量",
      "role": "secondary"
    },
    {
      "rankingKey": "pollution-complaints-received-per-100k",
      "shortLabel": "公害苦情受付件数",
      "role": "secondary"
    }
  ],
  "keywords": [
    "大気",
    "水環境",
    "公害",
    "水質"
  ]
};
