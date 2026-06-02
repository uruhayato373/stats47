import type { MetricConfig } from "../types";

export const ageSpecificDeathRate04Per1000: MetricConfig = {
  "key": "age-specific-death-rate-0-4-per-1000",
  "title": "年齢別死亡率",
  "subtitle": "0〜4歳（1000人当たり）",
  "unit": "‐",
  "category": "population",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010201",
    "cdCat01": "#A05205",
    "displayName": "人口動態統計",
    "url": "https://www.mhlw.go.jp/toukei/list/81-1.html",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2023,
    "to": 2023,
  },
  "yearFormat": "fiscal",
  "visualization": {
    "colorScheme": "interpolateBlues",
    "colorSchemeType": "sequential",
    "minValueType": "data-min",
  },
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 2,
  },
  "calculation": {
    "isCalculated": false,
  },
  "seoTitle": "年齢別死亡率ランキング都道府県【2023年】｜1位長崎県（0.66‐）",
  "seoDescription": "2023年の年齢別死亡率の都道府県別ランキング。1位長崎県（0.66‐）、最下位高知県（0.2‐）で3.3倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
  "isFeatured": false,
  "featuredOrder": 0,
};
