import type { MetricConfig } from "../types";

export const overseasTravelAnnualParticipationRate15plus: MetricConfig = {
  "key": "overseas-travel-annual-participation-rate-15plus",
  "title": "海外旅行の年間行動者率",
  "subtitle": "15歳以上",
  "description": "過去1年間に該当の活動をしたことのある人の割合",
  "unit": "％",
  "category": "tourism",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010207",
    "cdCat01": "#G04307",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2001,
    "to": 2001,
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
  "seoTitle": "海外旅行の年間行動者率ランキング都道府県【2001年】｜1位東京都（18.2％）",
  "seoDescription": "2001年の海外旅行の年間行動者率の都道府県別ランキング。1位東京都（18.2％）、最下位秋田県（5％）で3.6倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
  "isFeatured": false,
  "featuredOrder": 0,
};
