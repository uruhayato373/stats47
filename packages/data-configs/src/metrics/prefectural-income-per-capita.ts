import type { MetricConfig } from "../types";

export const prefecturalIncomePerCapita: MetricConfig = {
  "key": "prefectural-income-per-capita",
  "title": "1人当たり県民所得",
  "subtitle": "現行基準",
  "unit": "千円",
  "category": "economy",
  "source": {
    "kind": "external",
    "fetcherKey": "ssds",
    "displayName": "県民経済計算年報（内閣府）",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
    "config": {
      "source": {
        "name": "県民経済計算年報（内閣府）",
        "url": "https://www.stat.go.jp/data/ssds/index.htm",
      },
      "note": "統計表ID/cdCat01 は「現行基準」版で未確定 (TBD、推測で埋めない)。同系列で確定済みなのは H27年基準版 = per-capita-prefectural-income-h27 (statsDataId 0000010203, cdCat01 #C01321)。packages/data-configs/src/ssds/cdcat01-sources.generated.json に「県民経済計算年報」ソース名の登録を複数確認済み (2026-07-19 codebase内確認、live e-Stat 未検証)。現行基準の cdCat01 特定は estat-researcher の実API検証が必要。",
    },
  },
  "entities": [
    "prefecture",
  ],
  "years": "all",
  "yearFormat": "fiscal",
  // 観測値未投入 (R2 values.json なし)。統計表ID (cdCat01) 未確定のためデータ投入まで非公開。
  // 公開中の同名指標は per-capita-prefectural-income-h27 (H27年基準)。
  "isActive": false,
  "isFeatured": false,
  "featuredOrder": 0,
};
