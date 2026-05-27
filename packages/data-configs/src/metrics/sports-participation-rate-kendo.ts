import type { MetricConfig } from "../types";

export const sportsParticipationRateKendo: MetricConfig = {
  "key": "sports-participation-rate-kendo",
  "title": "剣道の行動者率",
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
  "seoTitle": "剣道の行動者率ランキング都道府県【2021年】｜1位長野県（0.9％）",
  "seoDescription": "2021年の剣道の行動者率の都道府県別ランキング。1位長野県（0.9％）、最下位徳島県（0.2％）で4.5倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
  "isFeatured": false,
  "featuredOrder": 0,
};
