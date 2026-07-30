import type { MetricConfig } from "../types";

export const hobbyParticipationRateCamping: MetricConfig = {
  "key": "hobby-participation-rate-camping",
  "title": "キャンプの行動者率",
  "unit": "％",
  "category": "educationsports",
  "source": {
    "kind": "estat",
    "statsDataId": "0003456573",
    "cdCat03": "34",
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
  "seoTitle": "キャンプの行動者率ランキング都道府県【2021年】｜1位北海道（9.1％）",
  "seoDescription": "2021年のキャンプの行動者率の都道府県別ランキング。1位北海道（9.1％）、最下位長崎県（3.3％）で2.8倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
