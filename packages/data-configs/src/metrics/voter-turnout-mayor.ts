import type { MetricConfig } from "../types";

export const voterTurnoutMayor: MetricConfig = {
  "key": "voter-turnout-mayor",
  "title": "市区町村長選挙投票率",
  "unit": "％",
  "category": "administrativefinancial",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010107",
    "cdCat01": "G6308",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "years": [
      2007,
      2011,
      2015,
      2019,
    ],
  },
  "yearFormat": "fiscal",
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
  "seoTitle": "市区町村長選挙投票率ランキング都道府県【2019年】｜1位福島県（87.85％）",
  "seoDescription": "2019年の市区町村長選挙投票率の都道府県別ランキング。1位福島県（87.85％）、最下位沖縄県（27.59％）で3.2倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
  "isFeatured": false,
  "featuredOrder": 0,
};
