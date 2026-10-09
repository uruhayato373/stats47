import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const studyParticipationRateComputer: MetricConfig = {
  "key": "study-participation-rate-computer",
  "title": "パソコンなどの情報処理の行動者率",
  "unit": "％",
  "category": "educationsports",
  "source": {
    "kind": "estat",
    "statsDataId": "0003456245",
    "cdCat03": "21",
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
  "seoTitle": "パソコンなどの情報処理の行動者率ランキング都道府県【2021年】｜1位東京都（23.2％）",
  "seoDescription": "2021年のパソコンなどの情報処理の行動者率の都道府県別ランキング。1位東京都（23.2％）、最下位岩手県（10.3％）で2.3倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
