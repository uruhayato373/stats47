import type { MetricConfig } from "../types";

export const sportsParticipationRateBowling: MetricConfig = {
  "key": "sports-participation-rate-bowling",
  "title": "ボウリングの行動者率",
  "unit": "％",
  "category": "educationsports",
  "source": {
    "kind": "estat",
    "statsDataId": "0003456409",
    "cdCat01": "0",
    "cdCat02": "99000",
    "displayName": "社会生活基本調査",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2021,
    "to": 2021,
  },
  "yearFormat": "calendar",
  "visualization": {
    "colorScheme": "interpolateBlues",
    "colorSchemeType": "sequential",
    "minValueType": "data-min",
  },
  "display": {
    "decimalPlaces": 1,
  },
  "calculation": {
    "isCalculated": false,
  },
  "seoTitle": "ボウリングの行動者率ランキング都道府県【2021年】｜1位沖縄県（6.7％）",
  "seoDescription": "2021年のボウリングの行動者率の都道府県別ランキング。1位沖縄県（6.7％）、最下位秋田県（2.5％）で2.7倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
  "isFeatured": false,
  "featuredOrder": 0,
};
