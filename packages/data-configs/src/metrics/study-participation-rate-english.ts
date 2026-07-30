import type { MetricConfig } from "../types";

export const studyParticipationRateEnglish: MetricConfig = {
  "key": "study-participation-rate-english",
  "title": "英語学習の行動者率",
  "unit": "％",
  "category": "educationsports",
  "source": {
    "kind": "estat",
    "statsDataId": "0003456245",
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
  "seoTitle": "英語学習の行動者率ランキング都道府県【2021年】｜1位東京都（21.2％）",
  "seoDescription": "2021年の英語学習の行動者率の都道府県別ランキング。1位東京都（21.2％）、最下位青森県（6.6％）で3.2倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
