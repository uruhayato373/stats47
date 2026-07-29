import type { MetricConfig } from "../types";

export const studyParticipationRateForeignLanguage: MetricConfig = {
  "key": "study-participation-rate-foreign-language",
  "title": "外国語学習の行動者率",
  "unit": "％",
  "category": "educationsports",
  "source": {
    "kind": "estat",
    "statsDataId": "0003456245",
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
  "seoTitle": "外国語学習の行動者率ランキング都道府県【2021年】｜1位東京都（23.3％）",
  "seoDescription": "2021年の外国語学習の行動者率の都道府県別ランキング。1位東京都（23.3％）、最下位秋田県（7.4％）で3.1倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
