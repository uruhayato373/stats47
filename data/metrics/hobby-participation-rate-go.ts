import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const hobbyParticipationRateGo: MetricConfig = {
  "key": "hobby-participation-rate-go",
  "title": "囲碁の行動者率",
  "unit": "％",
  "category": "educationsports",
  "source": {
    "kind": "estat",
    "statsDataId": "0003456573",
    "cdCat03": "29",
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
  "seoTitle": "囲碁の行動者率ランキング都道府県【2021年】｜1位長崎県（1.3％）",
  "seoDescription": "2021年の囲碁の行動者率の都道府県別ランキング。1位長崎県（1.3％）、最下位滋賀県（0.4％）で3.3倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
