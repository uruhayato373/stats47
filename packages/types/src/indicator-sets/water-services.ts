// AUTO-GENERATED — DO NOT EDIT.
// Source of truth: packages/data-configs/src/theme-catalog/water-services.ts
// Regenerate: npm run generate:catalog --workspace=@stats47/data-configs
import type { IndicatorSet } from "../indicator-set";

export const WATER_SERVICES_SET: IndicatorSet = {
  "key": "water-services",
  "title": "水道の持続性",
  "description": "上水道の給水人口比率、給水量、施設能力と下水道普及率を分けて比較します。上下水道料の家計支出はインフラ供給指標と別に扱います。",
  "category": "industry",
  "usage": "theme",
  "metrics": [
    {
      "rankingKey": "water-supply-population-ratio-2012on",
      "shortLabel": "上水道給水人口比率",
      "role": "primary"
    },
    {
      "rankingKey": "sewerage-coverage-rate",
      "shortLabel": "下水道処理人口普及率",
      "role": "secondary"
    },
    {
      "rankingKey": "water-supply-annual-volume",
      "shortLabel": "上水道年間給水量",
      "role": "secondary"
    },
    {
      "rankingKey": "water-supply-capacity",
      "shortLabel": "上水道施設能力",
      "role": "secondary"
    }
  ],
  "keywords": [
    "水道",
    "上水道",
    "下水道",
    "持続性"
  ]
};
