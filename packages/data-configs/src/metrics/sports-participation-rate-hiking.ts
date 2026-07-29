import type { MetricConfig } from "../types";

export const sportsParticipationRateHiking: MetricConfig = {
  "key": "sports-participation-rate-hiking",
  "title": "登山・ハイキングの行動者率",
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
  "seoTitle": "登山・ハイキングの行動者率ランキング都道府県【2021年】｜1位兵庫県（9.8％）",
  "seoDescription": "2021年の登山・ハイキングの行動者率の都道府県別ランキング。1位兵庫県（9.8％）、最下位沖縄県（2.4％）で4.1倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
