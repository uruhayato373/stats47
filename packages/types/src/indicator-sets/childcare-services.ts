// AUTO-GENERATED — DO NOT EDIT.
// Source of truth: packages/data-configs/src/theme-catalog/childcare-services.ts
// Regenerate: npm run generate:catalog --workspace=@stats47/data-configs
import type { IndicatorSet } from "../indicator-set";

export const CHILDCARE_SERVICES_SET: IndicatorSet = {
  "key": "childcare-services",
  "title": "保育の需給",
  "description": "保育所等の数・在所児・利用率と認定こども園数を比較します。待機児童や申込数は自治体別原典を都道府県集計した後に追加します。",
  "category": "education",
  "usage": "theme",
  "metrics": [
    {
      "rankingKey": "nursery-count-per-100k-0-5",
      "shortLabel": "保育所等数",
      "role": "primary"
    },
    {
      "rankingKey": "nursery-children-per-nursery-teacher",
      "shortLabel": "保育所等在所児数",
      "role": "secondary"
    },
    {
      "rankingKey": "nursery-utilization-rate",
      "shortLabel": "保育所等利用率",
      "role": "secondary"
    },
    {
      "rankingKey": "certified-childcare-center-count-per-100k-0-5",
      "shortLabel": "認定こども園数",
      "role": "secondary"
    }
  ],
  "keywords": [
    "保育",
    "保育所",
    "待機児童",
    "こども園"
  ]
};
