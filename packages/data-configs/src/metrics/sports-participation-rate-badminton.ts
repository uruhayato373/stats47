import type { MetricConfig } from "../types";

export const sportsParticipationRateBadminton: MetricConfig = {
  "key": "sports-participation-rate-badminton",
  "title": "バドミントンの行動者率",
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
  "seoTitle": "バドミントンの行動者率ランキング都道府県【2021年】｜1位宮城県（7.4％）",
  "seoDescription": "2021年のバドミントンの行動者率の都道府県別ランキング。1位宮城県（7.4％）、最下位長崎県（3.8％）で1.9倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
  "isFeatured": false,
  "featuredOrder": 0,
};
