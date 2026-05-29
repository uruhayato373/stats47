import type { MetricConfig } from "../types";

export const travelParticipationRateHomecoming: MetricConfig = {
  "key": "travel-participation-rate-homecoming",
  "title": "帰省・訪問などの旅行の行動者率",
  "unit": "％",
  "category": "tourism",
  "source": {
    "kind": "estat",
    "statsDataId": "0003456093",
    "cdCat01": "0",
    "cdCat02": "0",
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
  "seoTitle": "帰省・訪問などの旅行の行動者率ランキング都道府県【2021年】｜1位京都府（19.4％）",
  "seoDescription": "2021年の帰省・訪問などの旅行の行動者率の都道府県別ランキング。1位京都府（19.4％）、最下位沖縄県（6.3％）で3.1倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
  "isFeatured": false,
  "featuredOrder": 0,
};
