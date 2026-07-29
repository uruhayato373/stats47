import type { MetricConfig } from "../types";

export const travelParticipationRateOvernight: MetricConfig = {
  "key": "travel-participation-rate-overnight",
  "title": "旅行（1泊2日以上）の行動者率",
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
  "seoTitle": "旅行（1泊2日以上）の行動者率ランキング都道府県【2021年】｜1位東京都（41.9％）",
  "seoDescription": "2021年の旅行（1泊2日以上）の行動者率の都道府県別ランキング。1位東京都（41.9％）、最下位徳島県（16.4％）で2.6倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
