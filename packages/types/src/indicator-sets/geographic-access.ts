// AUTO-GENERATED — DO NOT EDIT.
// Source of truth: packages/data-configs/src/theme-catalog/geographic-access.ts
// Regenerate: npm run generate:catalog --workspace=@stats47/data-configs
import type { IndicatorSet } from "../indicator-set";

export const GEOGRAPHIC_ACCESS_SET: IndicatorSet = {
  "key": "geographic-access",
  "title": "交通空白と生活アクセス",
  "description": "駅から直線800m以内に中心点がある1km人口メッシュの人口割合を、2020年と2050年推計で比較します。徒歩経路・運行頻度を考慮した交通空白認定ではありません。駅数・バス事業者数は供給の基礎情報として別に掲載します。",
  "category": "safety",
  "usage": "theme",
  "metrics": [
    {
      "rankingKey": "railway-station-count",
      "shortLabel": "鉄道駅数",
      "role": "primary"
    },
    {
      "rankingKey": "bus-operators",
      "shortLabel": "バス事業者数",
      "role": "secondary"
    },
    {
      "rankingKey": "commute-by-car",
      "shortLabel": "自家用車通勤・通学者数",
      "role": "secondary"
    }
  ],
  "keywords": [
    "交通空白",
    "生活アクセス",
    "駅",
    "バス"
  ]
};
