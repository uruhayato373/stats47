import type { MetricConfig } from "../types";

export const sportsParticipationRateBaseball: MetricConfig = {
  "key": "sports-participation-rate-baseball",
  "title": "野球の行動者率",
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
  "seoTitle": "野球の行動者率ランキング都道府県【2021年】｜1位広島県（7.5％）",
  "seoDescription": "2021年の野球の行動者率の都道府県別ランキング。1位広島県（7.5％）、最下位高知県（4.1％）で1.8倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
  "isFeatured": false,
  "featuredOrder": 0,
};
