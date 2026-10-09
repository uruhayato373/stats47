import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const studyParticipationRateHomeEconomics: MetricConfig = {
  "key": "study-participation-rate-home-economics",
  "title": "家政・家事の行動者率",
  "unit": "％",
  "category": "educationsports",
  "source": {
    "kind": "estat",
    "statsDataId": "0003456245",
    "cdCat03": "4",
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
  "seoTitle": "家政・家事の行動者率ランキング都道府県【2021年】｜1位京都府（16.1％）",
  "seoDescription": "2021年の家政・家事の行動者率の都道府県別ランキング。1位京都府（16.1％）、最下位青森県（8.9％）で1.8倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
