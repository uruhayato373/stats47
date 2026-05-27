import type { MetricConfig } from "../types";

export const freelanceCount: MetricConfig = {
  "key": "freelance-count",
  "title": "フリーランス人口",
  "subtitle": "本業または副業がフリーランスの者",
  "unit": "人",
  "category": "laborwage",
  "source": {
    "kind": "estat",
    "statsDataId": "0004008516",
    "cdCat01": "0",
    "cdCat02": "0",
    "displayName": "就業構造基本調査",
    "url": "https://www.stat.go.jp/data/shugyou/2022/index.html",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2022,
    "to": 2022,
  },
  "yearFormat": "calendar",
  "visualization": {
    "colorScheme": "interpolateBlues",
    "colorSchemeType": "sequential",
    "minValueType": "zero",
  },
  "display": {
    "conversionFactor": 0.0001,
    "decimalPlaces": 1,
    "displayUnit": "万人",
  },
  "calculation": {
    "isCalculated": false,
    "normalizationOptions": [
      {
        "type": "per_population",
        "label": "人口10万人あたり",
        "unit": "人/10万人",
        "scaleFactor": 100000,
        "decimalPlaces": 1,
      },
      {
        "type": "per_area",
        "label": "面積100km²あたり",
        "unit": "人/100km²",
        "scaleFactor": 100,
        "decimalPlaces": 2,
      },
      {
        "type": "per_household",
        "label": "1世帯あたり",
        "unit": "人/世帯",
        "scaleFactor": 1,
        "decimalPlaces": 4,
      },
    ],
  },
  "seoTitle": "フリーランス人口ランキング都道府県【2022年】｜1位東京都（473,500人）",
  "seoDescription": "2022年のフリーランス人口の都道府県別ランキング。1位東京都（473,500人）、最下位鳥取県（7,400人）で64.0倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
  "isFeatured": false,
  "featuredOrder": 0,
};
