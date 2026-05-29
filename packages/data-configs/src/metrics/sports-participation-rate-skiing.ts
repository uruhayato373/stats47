import type { MetricConfig } from "../types";

export const sportsParticipationRateSkiing: MetricConfig = {
  "key": "sports-participation-rate-skiing",
  "title": "スキー・スノーボードの行動者率",
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
  "seoTitle": "スキー・スノーボードの行動者率ランキング都道府県【2021年】｜1位北海道（8.3％）",
  "seoDescription": "2021年のスキー・スノーボードの行動者率の都道府県別ランキング。1位北海道（8.3％）、最下位沖縄県（0.2％）で41.5倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
  "isFeatured": false,
  "featuredOrder": 0,
};
