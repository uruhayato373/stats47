// AUTO-GENERATED — DO NOT EDIT.
// Source of truth: packages/data-configs/src/theme-catalog/climate.ts
// Regenerate: npm run generate:catalog --workspace=@stats47/data-configs
import type { IndicatorSet } from "../indicator-set";

export const CLIMATE_SET: IndicatorSet = {
  "key": "climate",
  "title": "気候",
  "description": "日照、気温、降水・降雪の違いを、観測地点と期間を明示して比較する。",
  "category": "lifestyle",
  "usage": "theme",
  "metrics": [
    {
      "rankingKey": "annual-sunshine-duration",
      "shortLabel": "年間日照時間",
      "role": "primary"
    },
    {
      "rankingKey": "annual-clear-days",
      "shortLabel": "年間快晴日数",
      "role": "context"
    },
    {
      "rankingKey": "average-temperature",
      "shortLabel": "年平均気温",
      "role": "primary"
    },
    {
      "rankingKey": "maximum-temperature",
      "shortLabel": "最高気温",
      "role": "secondary"
    },
    {
      "rankingKey": "lowest-temperature",
      "shortLabel": "最低気温",
      "role": "context"
    },
    {
      "rankingKey": "annual-precipitation",
      "shortLabel": "年間降水量",
      "role": "secondary"
    },
    {
      "rankingKey": "annual-precipitation-days",
      "shortLabel": "年間降水日数",
      "role": "context"
    },
    {
      "rankingKey": "annual-snow-days",
      "shortLabel": "年間雪日数",
      "role": "secondary"
    },
    {
      "rankingKey": "maximum-snow-depth",
      "shortLabel": "最深積雪",
      "role": "secondary"
    },
    {
      "rankingKey": "heatstroke-emergency-transports",
      "shortLabel": "熱中症救急搬送人員",
      "role": "secondary"
    }
  ],
  "keywords": [
    "気候",
    "日照時間",
    "気温",
    "降水量",
    "降雪",
    "天候",
    "都道府県"
  ]
};
