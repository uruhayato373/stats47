import type { MetricConfig } from "../types";

export const sportsParticipationRateVolleyball: MetricConfig = {
  "key": "sports-participation-rate-volleyball",
  "title": "バレーボールの行動者率",
  "unit": "％",
  "category": "educationsports",
  "source": {
    "kind": "estat",
    "statsDataId": "0003456409",
    "cdCat03": "03",
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
  "seoTitle": "バレーボールの行動者率ランキング都道府県【2021年】｜1位宮崎県（5.9％）",
  "seoDescription": "2021年のバレーボールの行動者率の都道府県別ランキング。1位宮崎県（5.9％）、最下位富山県（2.3％）で2.6倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
