import type { MetricConfig } from "../types";

export const sportsAnnualParticipationRate10plus: MetricConfig = {
  "key": "sports-annual-participation-rate-10plus",
  "title": "スポーツの年間行動者率",
  "description": "過去1年間に該当の活動をしたことのある人の割合",
  "unit": "％",
  "category": "educationsports",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010207",
    "cdCat01": "#G042111",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "years": [
      2006,
      2011,
      2016,
      2021,
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
  "seoTitle": "スポーツの年間行動者率ランキング都道府県【2021年】｜1位東京都（74.5％）",
  "seoDescription": "2021年のスポーツの年間行動者率の都道府県別ランキング。1位東京都（74.5％）、最下位青森県（52.1％）で1.4倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
