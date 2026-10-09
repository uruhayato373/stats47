import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const studyParticipationRateForeignLanguage: MetricConfig = {
  "key": "study-participation-rate-foreign-language",
  "title": "外国語学習の行動者率",
  "unit": "％",
  "category": "educationsports",
  "source": {
    "kind": "estat",
    "statsDataId": "0003456245",
    "cdCat03": "1",
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
  "seoTitle": "外国語学習の行動者率ランキング都道府県【2021年】｜1位東京都（23.3％）",
  "seoDescription": "2021年の外国語学習の行動者率の都道府県別ランキング。1位東京都（23.3％）、最下位秋田県（7.4％）で3.1倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
