// AUTO-GENERATED — DO NOT EDIT.
// Source of truth: packages/data-configs/src/theme-catalog/climate.ts
// Regenerate: npm run generate:catalog --workspace=@stats47/data-configs
import type { IndicatorSet } from "../indicator-set";

export const CLIMATE_SET: IndicatorSet = {
  "key": "climate",
  "title": "気候",
  "description": "都道府県別の年間日照時間・年平均気温・年間降水量・降雪をランキングとチャートで比較。太平洋側と日本海側、南北の気候差や、晴れの多い地域・豪雪地帯を 47 都道府県のデータで読み解きます。",
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
      "shortLabel": "快晴日数",
      "role": "context"
    },
    {
      "rankingKey": "average-temperature",
      "shortLabel": "年平均気温",
      "role": "primary"
    },
    {
      "rankingKey": "maximum-temperature",
      "shortLabel": "最暖月の日最高平均",
      "role": "secondary"
    },
    {
      "rankingKey": "lowest-temperature",
      "shortLabel": "最寒月の日最低平均",
      "role": "secondary"
    },
    {
      "rankingKey": "annual-precipitation",
      "shortLabel": "年間降水量",
      "role": "primary"
    },
    {
      "rankingKey": "annual-precipitation-days",
      "shortLabel": "降水日数",
      "role": "primary"
    },
    {
      "rankingKey": "annual-snow-days",
      "shortLabel": "雪日数",
      "role": "context"
    }
  ],
  "keywords": [
    "気候",
    "日照時間",
    "気温",
    "降水量",
    "降雪",
    "快晴日数",
    "天候",
    "都道府県"
  ]
};
