// AUTO-GENERATED — DO NOT EDIT.
// Source of truth: packages/data-configs/src/theme-catalog/waste-recycling.ts
// Regenerate: npm run generate:catalog --workspace=@stats47/data-configs
import type { IndicatorSet } from "../indicator-set";

export const WASTE_RECYCLING_SET: IndicatorSet = {
  "key": "waste-recycling",
  "title": "ごみ・リサイクル",
  "description": "一般廃棄物のごみ排出量、最終処分量、リサイクル率を都道府県別に比較します。量と率を分け、同じ2023年度の条件で確認できます。2024年度まで公表済みですが、このページの比較対象は2023年度です。",
  "category": "lifestyle",
  "usage": "theme",
  "metrics": [
    {
      "rankingKey": "garbage-total-output",
      "shortLabel": "ごみ排出量",
      "role": "primary"
    },
    {
      "rankingKey": "waste-recycling-rate",
      "shortLabel": "リサイクル率",
      "role": "secondary"
    },
    {
      "rankingKey": "garbage-final-disposal",
      "shortLabel": "最終処分量",
      "role": "secondary"
    }
  ],
  "keywords": [
    "一般廃棄物",
    "ごみ",
    "リサイクル率",
    "最終処分量"
  ]
};
