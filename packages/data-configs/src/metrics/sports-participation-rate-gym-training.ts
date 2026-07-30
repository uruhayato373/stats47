import type { MetricConfig } from "../types";

export const sportsParticipationRateGymTraining: MetricConfig = {
  "key": "sports-participation-rate-gym-training",
  "title": "器具を使ったトレーニングの行動者率",
  "unit": "％",
  "category": "educationsports",
  "source": {
    "kind": "estat",
    "statsDataId": "0003456409",
    "cdCat03": "22",
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
  "seoTitle": "器具を使ったトレーニングの行動者率ランキング都道府県【2021年】｜1位神奈川県（15％）",
  "seoDescription": "2021年の器具を使ったトレーニングの行動者率の都道府県別ランキング。1位神奈川県（15％）、最下位長崎県（8.3％）で1.8倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
