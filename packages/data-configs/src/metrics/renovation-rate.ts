import type { MetricConfig } from "../types";

export const renovationRate: MetricConfig = {
  "key": "renovation-rate",
  "title": "リフォーム工事実施率",
  "subtitle": "2019年以降にリフォーム工事を行った持ち家の割合",
  "unit": "％",
  "category": "construction",
  "source": {
    "kind": "estat",
    "statsDataId": "0004025556",
    "cdCat01": "0",
    "cdCat02": "0",
    "displayName": "住宅・土地統計調査",
    "url": "https://www.stat.go.jp/data/jyutaku/2023/index.html",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2023,
    "to": 2023,
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
  "seoTitle": "リフォーム工事実施率ランキング都道府県【2023年】｜1位富山県（32.9％）",
  "seoDescription": "2023年のリフォーム工事実施率の都道府県別ランキング。1位富山県（32.9％）、最下位沖縄県（21.2％）で1.6倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
  "isFeatured": false,
  "featuredOrder": 0,
};
