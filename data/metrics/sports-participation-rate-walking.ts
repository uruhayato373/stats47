import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const sportsParticipationRateWalking: MetricConfig = {
  "key": "sports-participation-rate-walking",
  "title": "ウォーキング・軽い体操の行動者率",
  "unit": "％",
  "category": "educationsports",
  "source": {
    "kind": "estat",
    "statsDataId": "0003456409",
    "cdCat03": "20",
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
  "seoTitle": "ウォーキング・軽い体操の行動者率ランキング都道府県【2021年】｜1位東京都（52.3％）",
  "seoDescription": "2021年のウォーキング・軽い体操の行動者率の都道府県別ランキング。1位東京都（52.3％）、最下位青森県（32％）で1.6倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
