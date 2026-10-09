import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const sportsParticipationRateBowling: MetricConfig = {
  "key": "sports-participation-rate-bowling",
  "title": "ボウリングの行動者率",
  "unit": "％",
  "category": "educationsports",
  "source": {
    "kind": "estat",
    "statsDataId": "0003456409",
    "cdCat03": "13",
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
    ...DEFAULT_METRIC_PRESENTATION,
    "colorScheme": "interpolateBlues",
    "colorSchemeType": "sequential",
  },
  "display": {
    "decimalPlaces": 1,
  },
  "calculation": {
    "isCalculated": false,
  },
  "seoTitle": "ボウリングの行動者率ランキング都道府県【2021年】｜1位沖縄県（6.7％）",
  "seoDescription": "2021年のボウリングの行動者率の都道府県別ランキング。1位沖縄県（6.7％）、最下位秋田県（2.5％）で2.7倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
