// AUTO-GENERATED — DO NOT EDIT.
// Source of truth: packages/data-configs/src/theme-catalog/landslide-exposure.ts
// Regenerate: npm run generate:catalog --workspace=@stats47/data-configs
import type { IndicatorSet } from "../indicator-set";

export const LANDSLIDE_EXPOSURE_SET: IndicatorSet = {
  "key": "landslide-exposure",
  "title": "土砂災害",
  "description": "災害被害額・復旧費を基礎情報として掲載します。土砂災害警戒区域の数・面積と区域内人口は、原典のライセンスと都道府県別更新年を確認したGIS計算後に追加します。",
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
      "rankingKey": "disaster-relief-expenses-prefecture",
      "shortLabel": "災害救助費",
      "role": "secondary"
    }
  ],
  "keywords": [
    "土砂災害",
    "警戒区域",
    "災害",
    "復旧"
  ]
};
