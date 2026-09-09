// AUTO-GENERATED — DO NOT EDIT.
// Source of truth: packages/data-configs/src/theme-catalog/geographic-access.ts
// Regenerate: npm run generate:catalog --workspace=@stats47/data-configs
import type { IndicatorSet } from "../indicator-set";

export const GEOGRAPHIC_ACCESS_SET: IndicatorSet = {
  "key": "geographic-access",
  "title": "交通空白と生活アクセス",
  "description": "交通手段と鉄道・バスの供給を基礎指標として掲載します。距離圏外人口や医療施設までの距離は公式GIS計算が整った時点で追加し、既存の交通量を交通空白へ置き換えません。",
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
