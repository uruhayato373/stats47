import type { MetricConfig } from "../types";

export const sportsParticipationRateTennis: MetricConfig = {
  "key": "sports-participation-rate-tennis",
  "title": "テニスの行動者率",
  "unit": "％",
  "category": "educationsports",
  "source": {
    "kind": "estat",
    "statsDataId": "0003456409",
    "cdCat03": "07",
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
  "seoTitle": "テニスの行動者率ランキング都道府県【2021年】｜1位神奈川県（4.7％）",
  "seoDescription": "2021年のテニスの行動者率の都道府県別ランキング。1位神奈川県（4.7％）、最下位新潟県（1.8％）で2.6倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
