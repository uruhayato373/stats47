// AUTO-GENERATED — DO NOT EDIT.
// Source of truth: packages/data-configs/src/theme-catalog/business-demography.ts
// Regenerate: npm run generate:catalog --workspace=@stats47/data-configs
import type { IndicatorSet } from "../indicator-set";

export const BUSINESS_DEMOGRAPHY_SET: IndicatorSet = {
  "key": "business-demography",
  "title": "起業と開廃業",
  "description": "雇用保険適用事業所の新規成立・消滅と、前年度末の適用事業所数を分母にした開業率・廃業率を比較します。雇用者のいない事業を含まず、企業単位の設立・倒産件数とは異なります。",
  "category": "economy",
  "usage": "theme",
  "metrics": [
    {
      "rankingKey": "business-opening-rate",
      "shortLabel": "開業率（雇用保険適用事業所）",
      "role": "primary"
    },
    {
      "rankingKey": "business-closure-rate",
      "shortLabel": "廃業率（雇用保険適用事業所）",
      "role": "secondary"
    },
    {
      "rankingKey": "business-opening-establishments",
      "shortLabel": "年度内の新規成立事業所数",
      "role": "secondary"
    },
    {
      "rankingKey": "business-closure-establishments",
      "shortLabel": "年度内の消滅事業所数",
      "role": "secondary"
    },
    {
      "rankingKey": "business-opening-base-establishments",
      "shortLabel": "分母となる前年度末の適用事業所数",
      "role": "secondary"
    },
    {
      "rankingKey": "nonprimary-enterprises-count",
      "shortLabel": "会社・個人経営の企業総数",
      "role": "secondary"
    },
    {
      "rankingKey": "nonprimary-enterprises-under5-count",
      "shortLabel": "常用雇用者0〜4人の企業数",
      "role": "secondary"
    },
    {
      "rankingKey": "nonprimary-enterprises-employees",
      "shortLabel": "会社・個人経営の従業者総数",
      "role": "secondary"
    },
    {
      "rankingKey": "nonprimary-enterprises-under5-employees",
      "shortLabel": "常用雇用者0〜4人企業の従業者数",
      "role": "secondary"
    }
  ],
  "keywords": [
    "起業",
    "開業",
    "廃業",
    "事業所"
  ]
};
