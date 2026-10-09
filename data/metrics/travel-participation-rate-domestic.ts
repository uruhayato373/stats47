import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const travelParticipationRateDomestic: MetricConfig = {
  "key": "travel-participation-rate-domestic",
  "title": "国内旅行の行動者率",
  "unit": "％",
  "category": "tourism",
  "source": {
    "kind": "estat",
    "statsDataId": "0003456093",
    "cdCat03": "21",
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
  "seoTitle": "国内旅行の行動者率ランキング都道府県【2021年】｜1位東京都（41.7％）",
  "seoDescription": "2021年の国内旅行の行動者率の都道府県別ランキング。1位東京都（41.7％）、最下位徳島県（16.3％）で2.6倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
