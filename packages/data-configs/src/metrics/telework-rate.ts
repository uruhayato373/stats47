import type { MetricConfig } from "../types";

export const teleworkRate: MetricConfig = {
  "key": "telework-rate",
  "title": "テレワーク実施率",
  "subtitle": "有業者のうちテレワークを実施した人の割合",
  "unit": "％",
  "category": "laborwage",
  "source": {
    "kind": "estat",
    "statsDataId": "0004008436",
    "cdCat01": "0",
    "cdCat02": "00",
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
    "conversionFactor": 1,
    "decimalPlaces": 1,
  },
  "calculation": {
    "isCalculated": false,
  },
  "seoTitle": "テレワーク実施率ランキング都道府県【2022年】｜1位東京都（39.8％）",
  "seoDescription": "2022年のテレワーク実施率の都道府県別ランキング。1位東京都（39.8％）、最下位秋田県（6.4％）で6.2倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
  "isFeatured": false,
  "featuredOrder": 0,
};
