import type { MetricConfig } from "../types";

export const crudeDeathRate: MetricConfig = {
  "key": "crude-death-rate",
  "title": "粗死亡率",
  "unit": "‐",
  "category": "population",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010201",
    "cdCat01": "#A05204",
    "displayName": "人口動態統計",
    "url": "https://www.mhlw.go.jp/toukei/list/81-1.html",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 1975,
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
  "seoTitle": "粗死亡率ランキング都道府県【2023年】｜1位秋田県（19.17‐）",
  "seoDescription": "2023年の粗死亡率の都道府県別ランキング。1位秋田県（19.17‐）、最下位東京都（9.74‐）で2.0倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
  "isFeatured": false,
  "featuredOrder": 0,
};
