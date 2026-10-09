import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const sportsParticipationRateSoccer: MetricConfig = {
  "key": "sports-participation-rate-soccer",
  "title": "サッカーの行動者率",
  "unit": "％",
  "category": "educationsports",
  "source": {
    "kind": "estat",
    "statsDataId": "0003456409",
    "cdCat03": "05",
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
  "seoTitle": "サッカーの行動者率ランキング都道府県【2021年】｜1位愛知県（6％）",
  "seoDescription": "2021年のサッカーの行動者率の都道府県別ランキング。1位愛知県（6％）、最下位岐阜県（2.7％）で2.2倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
