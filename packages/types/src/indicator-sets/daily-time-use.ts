// AUTO-GENERATED — DO NOT EDIT.
// Source of truth: packages/data-configs/src/theme-catalog/daily-time-use.ts
// Regenerate: npm run generate:catalog --workspace=@stats47/data-configs
import type { IndicatorSet } from "../indicator-set";

export const DAILY_TIME_USE_SET: IndicatorSet = {
  "key": "daily-time-use",
  "title": "睡眠と生活時間",
  "description": "睡眠・家事の平均時間と、有業者に限った仕事・趣味娯楽の平均時間を男女別に比較します。対象が異なるため合計しません。平均時間は一日の行動配分であり、生活の良否を示す指標ではありません。",
  "category": "demographics",
  "usage": "theme",
  "metrics": [
    {
      "rankingKey": "sleep-avg-time-female",
      "shortLabel": "女性の睡眠時間",
      "role": "primary"
    },
    {
      "rankingKey": "sleep-avg-time-male",
      "shortLabel": "男性の睡眠時間",
      "role": "secondary"
    },
    {
      "rankingKey": "housework-avg-time-female",
      "shortLabel": "女性の家事時間",
      "role": "secondary"
    },
    {
      "rankingKey": "housework-avg-time-male",
      "shortLabel": "男性の家事時間",
      "role": "secondary"
    },
    {
      "rankingKey": "hobby-leisure-avg-time-employed-female",
      "shortLabel": "女性有業者の趣味・娯楽時間",
      "role": "secondary"
    },
    {
      "rankingKey": "hobby-leisure-avg-time-employed-male",
      "shortLabel": "男性有業者の趣味・娯楽時間",
      "role": "secondary"
    },
    {
      "rankingKey": "work-avg-time-employed-female",
      "shortLabel": "女性有業者の仕事時間",
      "role": "secondary"
    },
    {
      "rankingKey": "work-avg-time-employed-male",
      "shortLabel": "男性有業者の仕事時間",
      "role": "secondary"
    }
  ],
  "keywords": [
    "生活時間",
    "睡眠",
    "家事",
    "余暇"
  ]
};
