// AUTO-GENERATED — DO NOT EDIT.
// Source of truth: packages/data-configs/src/theme-catalog/innovation-patents.ts
// Regenerate: npm run generate:catalog --workspace=@stats47/data-configs
import type { IndicatorSet } from "../indicator-set";

export const INNOVATION_PATENTS_SET: IndicatorSet = {
  "key": "innovation-patents",
  "title": "研究開発と特許",
  "description": "特許・意匠・商標の出願と登録、延べ発明者数を比較します。件数は筆頭出願人の住所、発明者数は出願に記載された全発明者の延べ人数です。発明者数はPCT国内移行を含む2016年以降を表示します。研究の質や事業化収益を表すものではありません。",
  "category": "industry",
  "usage": "theme",
  "metrics": [
    {
      "rankingKey": "patent-application-count",
      "shortLabel": "特許出願件数（筆頭出願人住所）",
      "role": "primary"
    },
    {
      "rankingKey": "patent-registration-count",
      "shortLabel": "特許登録件数（筆頭出願人住所）",
      "role": "secondary"
    },
    {
      "rankingKey": "patent-inventor-count",
      "shortLabel": "出願に記載された延べ発明者数",
      "role": "secondary"
    },
    {
      "rankingKey": "design-application-count",
      "shortLabel": "意匠出願件数",
      "role": "secondary"
    },
    {
      "rankingKey": "design-registration-count",
      "shortLabel": "意匠登録件数",
      "role": "secondary"
    },
    {
      "rankingKey": "trademark-application-count",
      "shortLabel": "商標出願件数",
      "role": "secondary"
    },
    {
      "rankingKey": "trademark-registration-count",
      "shortLabel": "商標登録件数",
      "role": "secondary"
    }
  ],
  "keywords": [
    "研究開発",
    "特許",
    "意匠",
    "商標",
    "発明者"
  ]
};
