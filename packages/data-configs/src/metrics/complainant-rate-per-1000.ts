import type { MetricConfig } from "../types";

export const complainantRatePer1000: MetricConfig = {
  "key": "complainant-rate-per-1000",
  "title": "有訴者率",
  "unit": "‐",
  "category": "socialsecurity",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010209",
    "cdCat01": "#I04105",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "years": [
      2007,
      2010,
      2013,
      2016,
      2019,
      2022,
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
    "decimalPlaces": 1,
  },
  "calculation": {
    "isCalculated": false,
  },
  "groupKey": "complainant-count",
  "seoTitle": "有訴者率ランキング都道府県【2022年】｜1位兵庫県（314.9‐）",
  "seoDescription": "2022年の有訴者率の都道府県別ランキング。1位兵庫県（314.9‐）、最下位東京都（244‐）で1.3倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
  "isFeatured": false,
  "featuredOrder": 0,
};
