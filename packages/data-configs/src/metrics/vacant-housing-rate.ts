import type { MetricConfig } from "../types";

export const vacantHousingRate: MetricConfig = {
  "key": "vacant-housing-rate",
  "title": "空き家率",
  "subtitle": "総住宅数に占める空き家の割合",
  "unit": "％",
  "category": "construction",
  "source": {
    "kind": "estat",
    "statsDataId": "0004021440",
    "cdCat01": "22",
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
  "seoTitle": "空き家率ランキング都道府県【2023年】｜1位徳島県（21.3％）",
  "seoDescription": "2023年の空き家率の都道府県別ランキング。1位徳島県（21.3％）、最下位埼玉県（9.3％）で2.3倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
  "isFeatured": false,
  "featuredOrder": 0,
};
