import type { MetricConfig } from "../types";

export const hobbyParticipationRateFlowerArrangement: MetricConfig = {
  "key": "hobby-participation-rate-flower-arrangement",
  "title": "華道の行動者率",
  "unit": "％",
  "category": "educationsports",
  "source": {
    "kind": "estat",
    "statsDataId": "0003456573",
    "cdCat03": "16",
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
  "seoTitle": "華道の行動者率ランキング都道府県【2021年】｜1位島根県（2.1％）",
  "seoDescription": "2021年の華道の行動者率の都道府県別ランキング。1位島根県（2.1％）、最下位沖縄県（0.7％）で3.0倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
