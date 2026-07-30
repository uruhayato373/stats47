import type { MetricConfig } from "../types";

export const sportsParticipationRateTableTennis: MetricConfig = {
  "key": "sports-participation-rate-table-tennis",
  "title": "卓球の行動者率",
  "unit": "％",
  "category": "educationsports",
  "source": {
    "kind": "estat",
    "statsDataId": "0003456409",
    "cdCat03": "06",
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
  "seoTitle": "卓球の行動者率ランキング都道府県【2021年】｜1位東京都（6.2％）",
  "seoDescription": "2021年の卓球の行動者率の都道府県別ランキング。1位東京都（6.2％）、最下位青森県（2.8％）で2.2倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
