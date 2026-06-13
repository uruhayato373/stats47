import type { MetricConfig } from "../types";

export const prefecturalIncomePerCapita: MetricConfig = {
  "key": "prefectural-income-per-capita",
  "title": "1人当たり県民所得",
  "subtitle": "現行基準",
  "unit": "千円",
  "category": "economy",
  "source": {
    "kind": "external",
    "fetcherKey": "unknown",
    "config": {},
  },
  "entities": [
    "prefecture",
  ],
  "years": "all",
  "yearFormat": "fiscal",
  // 観測値未投入 (R2 values.json なし・source は placeholder)。データ投入まで非公開。
  // 公開中の同名指標は per-capita-prefectural-income-h27 (H27年基準)。
  "isActive": false,
  "isFeatured": false,
  "featuredOrder": 0,
};
