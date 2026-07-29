import type { MetricConfig } from "../types";

export const foreignPopulationPer100k: MetricConfig = {
  "key": "foreign-population-per-100k",
  "title": "外国人人口（人口10万人当たり）",
  "subtitle": "10万人当たり（別統計）",
  "unit": "人",
  "category": "international",
  "source": {
    "kind": "estat",
    "statsDataId": "0000020301",
    "cdCat01": "#A01601",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "city",
  ],
  "years": {
    "years": [
      1980,
      1985,
      1990,
      1995,
      2000,
      2005,
      2010,
      2015,
      2020,
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
    ],
  },
  "seoTitle": "外国人人口（人口10万人当たり）ランキング市区町村【2020年】｜1位長野県 川上村（18,991.7人）",
  "seoDescription": "2020年の外国人人口（人口10万人当たり）の市区町村別ランキング。1位長野県 川上村（18,991.7人）、最下位和歌山県 北山村（0人）で地図やグラフで市区町村を比較。",
  "isActive": true,
};
