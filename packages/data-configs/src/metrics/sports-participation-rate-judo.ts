import type { MetricConfig } from "../types";

export const sportsParticipationRateJudo: MetricConfig = {
  "key": "sports-participation-rate-judo",
  "title": "柔道の行動者率",
  "unit": "％",
  "category": "educationsports",
  "source": {
    "kind": "estat",
    "statsDataId": "0003456409",
    "cdCat03": "11",
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
  "seoTitle": "柔道の行動者率ランキング都道府県【2021年】｜1位山口県（1.1％）",
  "seoDescription": "2021年の柔道の行動者率の都道府県別ランキング。1位山口県（1.1％）、最下位広島県（0.1％）で11.0倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
