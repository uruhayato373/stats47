import type { MetricConfig } from "../types";

export const travelLeisureAnnualParticipationRate10plus: MetricConfig = {
  "key": "travel-leisure-annual-participation-rate-10plus",
  "title": "旅行・行楽の年間行動者率",
  "description": "過去1年間に該当の活動をしたことのある人の割合",
  "unit": "％",
  "category": "tourism",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010207",
    "cdCat01": "#G043061",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2021,
    "to": 2021,
  },
  "yearFormat": "fiscal",
  "visualization": {
    "colorScheme": "interpolateBlues",
    "colorSchemeType": "sequential",
    "divergingMidpoint": "zero",
    "minValueType": "data-min",
    "isReversed": false,
    "isSymmetrized": false,
  },
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 1,
  },
  "calculation": {
    "isCalculated": false,
  },
  "seoTitle": "旅行・行楽の年間行動者率ランキング都道府県【2021年】｜1位愛知県（57.6％）",
  "seoDescription": "2021年の旅行・行楽の年間行動者率の都道府県別ランキング。1位愛知県（57.6％）、最下位沖縄県（31.1％）で1.9倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
  "isFeatured": false,
  "featuredOrder": 0,
};
