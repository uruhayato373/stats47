import type { MetricConfig } from "../types";

export const hobbyParticipationRatePachinko: MetricConfig = {
  "key": "hobby-participation-rate-pachinko",
  "title": "パチンコの行動者率",
  "unit": "％",
  "category": "educationsports",
  "source": {
    "kind": "estat",
    "statsDataId": "0003456573",
    "cdCat03": "31",
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
  "seoTitle": "パチンコの行動者率ランキング都道府県【2021年】｜1位鹿児島県（8.6％）",
  "seoDescription": "2021年のパチンコの行動者率の都道府県別ランキング。1位鹿児島県（8.6％）、最下位沖縄県（3.6％）で2.4倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
