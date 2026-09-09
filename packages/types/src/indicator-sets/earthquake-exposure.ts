// AUTO-GENERATED — DO NOT EDIT.
// Source of truth: packages/data-configs/src/theme-catalog/earthquake-exposure.ts
// Regenerate: npm run generate:catalog --workspace=@stats47/data-configs
import type { IndicatorSet } from "../indicator-set";

export const EARTHQUAKE_EXPOSURE_SET: IndicatorSet = {
  "key": "earthquake-exposure",
  "title": "地震への備え",
  "description": "住宅の耐震改修率・耐震工事数と火災・地震保険料を比較します。J-SHISの確率・震度曝露人口は版とシナリオを固定したGIS計算後に追加します。",
  "category": "safety",
  "usage": "theme",
  "metrics": [
    {
      "rankingKey": "earthquake-renovation-rate",
      "shortLabel": "耐震改修工事実施率",
      "role": "primary"
    },
    {
      "rankingKey": "earthquake-retrofit-housing",
      "shortLabel": "耐震工事をした住宅数（持ち家）",
      "role": "secondary"
    },
    {
      "rankingKey": "fire-earthquake-insurance-consumption-expenditure",
      "shortLabel": "火災・地震保険料",
      "role": "secondary"
    }
  ],
  "keywords": [
    "地震",
    "耐震",
    "防災",
    "住宅"
  ]
};
