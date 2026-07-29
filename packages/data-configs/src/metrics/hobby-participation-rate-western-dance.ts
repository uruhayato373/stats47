import type { MetricConfig } from "../types";

export const hobbyParticipationRateWesternDance: MetricConfig = {
  "key": "hobby-participation-rate-western-dance",
  "title": "洋舞・社交ダンスの行動者率",
  "unit": "％",
  "category": "educationsports",
  "source": {
    "kind": "estat",
    "statsDataId": "0003456573",
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
  "seoTitle": "洋舞・社交ダンスの行動者率ランキング都道府県【2021年】｜1位東京都（1.7％）",
  "seoDescription": "2021年の洋舞・社交ダンスの行動者率の都道府県別ランキング。1位東京都（1.7％）、最下位徳島県（0.5％）で3.4倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
