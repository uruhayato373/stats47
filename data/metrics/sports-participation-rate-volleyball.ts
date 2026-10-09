import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

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
  "seoTitle": "バレーボールの行動者率ランキング都道府県【2021年】｜1位宮崎県（5.9％）",
  "seoDescription": "2021年のバレーボールの行動者率の都道府県別ランキング。1位宮崎県（5.9％）、最下位富山県（2.3％）で2.6倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
