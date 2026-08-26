import type { MetricConfig } from "../types";

export const dairyCattleCount: MetricConfig = {
  "key": "dairy-cattle-count",
  "title": "乳用牛飼養頭数",
  "subtitle": "乳用牛（めす）の飼養頭数合計",
  "unit": "頭",
  "category": "agriculture",
  "source": {
    "kind": "estat",
    "statsDataId": "0004047181",
    "cdCat02": "1002",
    "areaAxis": {
      "axis": "cat01",
      "scheme": "name",
    },
    "displayName": "畜産統計調査",
    "url": "https://www.maff.go.jp/j/tokei/kouhyou/tikusan/",
  },
  "entities": [
    "prefecture",
  ],
  // 表を令和7年 (2025) 版 0004047181 に差し替えたため 2025 単年。
  // 旧表 0003238330 は全年 46 県で **北海道が欠落**していた (都府県のみの表)。
  "years": {
    "from": 2025,
    "to": 2025,
  },
  "yearFormat": "calendar",
  "visualization": {
    "colorScheme": "interpolateBlues",
    "colorSchemeType": "sequential",
    "minValueType": "zero",
  },
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 0,
  },
  "calculation": {
    "isCalculated": false,
    "normalizationOptions": [
      {
        "type": "per_population",
        "label": "人口10万人あたり",
        "unit": "頭/10万人",
        "scaleFactor": 100000,
        "decimalPlaces": 1,
      },
      {
        "type": "per_area",
        "label": "面積100km²あたり",
        "unit": "頭/100km²",
        "scaleFactor": 100,
        "decimalPlaces": 2,
      },
    ],
  },
  "seoTitle": "乳用牛飼養頭数 都道府県ランキング【2025年】｜1位北海道（816,800頭）",
  "seoDescription": "2025年の乳用牛飼養頭数を都道府県別に比較。1位は北海道（816,800頭）、最下位は和歌山県（510頭）、最大と最小の差は1601.6倍です。地図やグラフで47都道府県の違いを確認できます。",
  "isActive": true,
};
