import type { MetricConfig } from "../types";

export const studyParticipationRateOtherLanguage: MetricConfig = {
  "key": "study-participation-rate-other-language",
  "title": "英語以外の外国語学習の行動者率",
  "unit": "％",
  "category": "educationsports",
  "source": {
    "kind": "estat",
    "statsDataId": "0003456245",
    "cdCat03": "12",
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
  "seoTitle": "英語以外の外国語学習の行動者率ランキング都道府県【2021年】｜1位東京都（7.1％）",
  "seoDescription": "2021年の英語以外の外国語学習の行動者率の都道府県別ランキング。1位東京都（7.1％）、最下位秋田県（1.8％）で3.9倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
