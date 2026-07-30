import type { MetricConfig } from "../types";

export const sportsParticipationRateGroundGolf: MetricConfig = {
  "key": "sports-participation-rate-ground-golf",
  "title": "グラウンドゴルフの行動者率",
  "unit": "％",
  "category": "educationsports",
  "source": {
    "kind": "estat",
    "statsDataId": "0003456409",
    "cdCat03": "10",
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
  "seoTitle": "グラウンドゴルフの行動者率ランキング都道府県【2021年】｜1位鹿児島県（5.1％）",
  "seoDescription": "2021年のグラウンドゴルフの行動者率の都道府県別ランキング。1位鹿児島県（5.1％）、最下位高知県（0.6％）で8.5倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
