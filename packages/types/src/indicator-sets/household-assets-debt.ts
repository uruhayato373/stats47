// AUTO-GENERATED — DO NOT EDIT.
// Source of truth: packages/data-configs/src/theme-catalog/household-assets-debt.ts
// Regenerate: npm run generate:catalog --workspace=@stats47/data-configs
import type { IndicatorSet } from "../indicator-set";

export const HOUSEHOLD_ASSETS_DEBT_SET: IndicatorSet = {
  "key": "household-assets-debt",
  "title": "貯蓄と負債",
  "description": "二人以上世帯の貯蓄現在高と金融負債残高、貯蓄率を別々に比較します。世帯属性や調査年の違いを補正した推計は行いません。",
  "category": "economy",
  "usage": "theme",
  "metrics": [
    {
      "rankingKey": "financial-assets-balance-multi-person-households",
      "shortLabel": "貯蓄現在高",
      "role": "primary"
    },
    {
      "rankingKey": "financial-debt-balance",
      "shortLabel": "金融負債残高",
      "role": "secondary"
    },
    {
      "rankingKey": "avg-savings-rate-worker-households",
      "shortLabel": "平均貯蓄率",
      "role": "secondary"
    }
  ],
  "keywords": [
    "貯蓄",
    "負債",
    "家計"
  ]
};
