// AUTO-GENERATED — DO NOT EDIT.
// Source of truth: packages/data-configs/src/theme-catalog/landslide-exposure.ts
// Regenerate: npm run generate:catalog --workspace=@stats47/data-configs
import type { IndicatorSet } from "../indicator-set";

export const LANDSLIDE_EXPOSURE_SET: IndicatorSet = {
  "key": "landslide-exposure",
  "title": "土砂災害",
  "description": "土砂災害警戒区域と、その内数である特別警戒区域の指定数を現象別に比較します。2026年6月30日時点の行政指定状況です。別の空間分析では2025年度版の指定区域面、2020年人口、2022年の公共施設を重ねます。区域の更新日は県により異なり、京都府は利用制限により対象外です。指定数と面の集計は年・対象が異なります。",
  "category": "safety",
  "usage": "theme",
  "metrics": [
    {
      "rankingKey": "landslide-warning-zone-count",
      "shortLabel": "土砂災害警戒区域数",
      "role": "primary"
    },
    {
      "rankingKey": "landslide-special-warning-zone-count",
      "shortLabel": "土砂災害特別警戒区域数",
      "role": "secondary"
    },
    {
      "rankingKey": "debris-flow-warning-zone-count",
      "shortLabel": "土石流の警戒区域数",
      "role": "secondary"
    },
    {
      "rankingKey": "debris-flow-special-warning-zone-count",
      "shortLabel": "土石流の特別警戒区域数",
      "role": "secondary"
    },
    {
      "rankingKey": "steep-slope-warning-zone-count",
      "shortLabel": "急傾斜地崩壊の警戒区域数",
      "role": "secondary"
    },
    {
      "rankingKey": "steep-slope-special-warning-zone-count",
      "shortLabel": "急傾斜地崩壊の特別警戒区域数",
      "role": "secondary"
    },
    {
      "rankingKey": "landslip-warning-zone-count",
      "shortLabel": "地滑りの警戒区域数",
      "role": "secondary"
    },
    {
      "rankingKey": "landslip-special-warning-zone-count",
      "shortLabel": "地滑りの特別警戒区域数",
      "role": "secondary"
    }
  ],
  "keywords": [
    "土砂災害",
    "警戒区域",
    "土石流",
    "地滑り"
  ]
};
