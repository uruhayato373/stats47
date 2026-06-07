import type { MetricConfig } from "../types";

export const naturalStillbirths: MetricConfig = {
  "key": "natural-stillbirths",
  "title": "自然死産数",
  "unit": "胎",
  "category": "socialsecurity",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010101",
    "cdCat01": "A427001",
    "displayName": "人口動態統計",
    "url": "https://www.mhlw.go.jp/toukei/list/81-1.html",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 1985,
    "to": 2007,
  },
  "yearFormat": "fiscal",
  "visualization": {
    "colorScheme": "interpolateBlues",
    "colorSchemeType": "sequential",
    "minValueType": "data-min",
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
        "unit": "胎/10万人",
        "scaleFactor": 100000,
        "decimalPlaces": 1,
      },
      {
        "type": "per_area",
        "label": "面積100km²あたり",
        "unit": "胎/100km²",
        "scaleFactor": 100,
        "decimalPlaces": 2,
      },
    ],
  },
  "seoTitle": "自然死産数ランキング都道府県【2007年】｜1位東京都（1,201胎）",
  "seoDescription": "2007年の自然死産数の都道府県別ランキング。1位東京都（1,201胎）、最下位徳島県（60胎）で20.0倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
  "isFeatured": false,
  "featuredOrder": 0,
};
