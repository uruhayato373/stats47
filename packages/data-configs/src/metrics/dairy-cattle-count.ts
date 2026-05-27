import type { MetricConfig } from "../types";

export const dairyCattleCount: MetricConfig = {
  "key": "dairy-cattle-count",
  "title": "乳用牛飼養頭数",
  "subtitle": "乳用牛（めす）の飼養頭数合計",
  "unit": "頭",
  "category": "agriculture",
  "source": {
    "kind": "estat",
    "statsDataId": "0003238330",
    "cdCat01": "110",
    "displayName": "畜産統計調査",
    "url": "https://www.maff.go.jp/j/tokei/kouhyou/tikusan/",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2018,
    "to": 2018,
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
      {
        "type": "per_household",
        "label": "1世帯あたり",
        "unit": "頭/世帯",
        "scaleFactor": 1,
        "decimalPlaces": 4,
      },
    ],
  },
  "seoTitle": "乳用牛飼養頭数ランキング都道府県【2018年】｜1位北海道（790,900頭）",
  "seoDescription": "2018年の乳用牛飼養頭数の都道府県別ランキング。1位北海道（790,900頭）、最下位和歌山県（610頭）で1296.6倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
  "isFeatured": false,
  "featuredOrder": 0,
};
