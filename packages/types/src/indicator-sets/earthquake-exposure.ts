// AUTO-GENERATED — DO NOT EDIT.
// Source of truth: packages/data-configs/src/theme-catalog/earthquake-exposure.ts
// Regenerate: npm run generate:catalog --workspace=@stats47/data-configs
import type { IndicatorSet } from "../indicator-set";

export const EARTHQUAKE_EXPOSURE_SET: IndicatorSet = {
  "key": "earthquake-exposure",
  "title": "地震への備え",
  "description": "30年間の超過確率3%に対応する地震動の震度帯別人口を、2020年人口と2050年推計人口で比較します。住宅の耐震改修指標も別に確認できます。",
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
      "shortLabel": "火災・地震保険料支出（県庁所在市・二人以上世帯・年額）",
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
