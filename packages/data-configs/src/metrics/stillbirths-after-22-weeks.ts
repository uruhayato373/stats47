import type { MetricConfig } from "../types";

export const stillbirthsAfter22Weeks: MetricConfig = {
  "key": "stillbirths-after-22-weeks",
  "title": "死産数",
  "subtitle": "妊娠22週以後",
  "unit": "胎",
  "category": "socialsecurity",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010101",
    "cdCat01": "A4271",
    "displayName": "人口動態統計",
    "url": "https://www.mhlw.go.jp/toukei/list/81-1.html",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "years": [
      2004,
      2005,
      2006,
      2007,
      2008,
      2009,
      2010,
      2011,
      2012,
      2013,
      2014,
      2023,
    ],
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
  "seoTitle": "死産数ランキング都道府県【2023年】｜1位東京都（225胎）",
  "seoDescription": "2023年の死産数の都道府県別ランキング。1位東京都（225胎）、最下位島根県（7胎）で32.1倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
  "isFeatured": false,
  "featuredOrder": 0,
};
