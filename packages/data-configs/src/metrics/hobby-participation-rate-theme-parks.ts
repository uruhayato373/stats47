import type { MetricConfig } from "../types";

export const hobbyParticipationRateThemeParks: MetricConfig = {
  "key": "hobby-participation-rate-theme-parks",
  "title": "遊園地・動植物園・水族館の行動者率",
  "unit": "％",
  "category": "educationsports",
  "source": {
    "kind": "estat",
    "statsDataId": "0003456573",
    "cdCat03": "33",
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
  "seoTitle": "遊園地・動植物園・水族館の行動者率ランキング都道府県【2021年】｜1位愛知県（25.5％）",
  "seoDescription": "2021年の遊園地・動植物園・水族館の行動者率の都道府県別ランキング。1位愛知県（25.5％）、最下位岩手県（8.2％）で3.1倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
