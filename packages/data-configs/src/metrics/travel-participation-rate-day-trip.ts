import type { MetricConfig } from "../types";

export const travelParticipationRateDayTrip: MetricConfig = {
  "key": "travel-participation-rate-day-trip",
  "title": "行楽（日帰り）の行動者率",
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
  "seoTitle": "行楽（日帰り）の行動者率ランキング都道府県【2021年】｜1位愛知県（47.1％）",
  "seoDescription": "2021年の行楽（日帰り）の行動者率の都道府県別ランキング。1位愛知県（47.1％）、最下位沖縄県（23.6％）で2.0倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
