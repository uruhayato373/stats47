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
    ],
  },
  "seoTitle": "乳用牛の1,296倍格差｜北海道が2位栃木の15倍という日本酪農の集中構造（2018）",
  "seoDescription": "1位北海道790,900頭 vs 最下位和歌山610頭で1,296倍の圧倒的格差。2位栃木の実に15倍という酪農産業の集中はなぜ生まれたか？日本の酪農構造を47都道府県で可視化（2018年）。",
  "isActive": true,
  "isFeatured": false,
  "featuredOrder": 0,
};
