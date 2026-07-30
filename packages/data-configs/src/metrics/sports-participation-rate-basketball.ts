import type { MetricConfig } from "../types";

export const sportsParticipationRateBasketball: MetricConfig = {
  "key": "sports-participation-rate-basketball",
  "title": "バスケットボールの行動者率",
  "unit": "％",
  "category": "educationsports",
  "source": {
    "kind": "estat",
    "statsDataId": "0003456409",
    "cdCat03": "04",
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
  "seoTitle": "バスケットボールの行動者率ランキング都道府県【2021年】｜1位秋田県（5.3％）",
  "seoDescription": "2021年のバスケットボールの行動者率の都道府県別ランキング。1位秋田県（5.3％）、最下位大分県（2.4％）で2.2倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
