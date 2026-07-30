import type { MetricConfig } from "../types";

export const hobbyParticipationRateShogi: MetricConfig = {
  "key": "hobby-participation-rate-shogi",
  "title": "将棋の行動者率",
  "unit": "％",
  "category": "educationsports",
  "source": {
    "kind": "estat",
    "statsDataId": "0003456573",
    "cdCat03": "30",
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
  "seoTitle": "将棋の行動者率ランキング都道府県【2021年】｜1位香川県（3.8％）",
  "seoDescription": "2021年の将棋の行動者率の都道府県別ランキング。1位香川県（3.8％）、最下位秋田県（1.4％）で2.7倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
