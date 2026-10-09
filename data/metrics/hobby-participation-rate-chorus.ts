import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const hobbyParticipationRateChorus: MetricConfig = {
  "key": "hobby-participation-rate-chorus",
  "title": "コーラス・声楽の行動者率",
  "unit": "％",
  "category": "educationsports",
  "source": {
    "kind": "estat",
    "statsDataId": "0003456573",
    "cdCat03": "11",
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
  "seoTitle": "コーラス・声楽の行動者率ランキング都道府県【2021年】｜1位神奈川県（2.2％）",
  "seoDescription": "2021年のコーラス・声楽の行動者率の都道府県別ランキング。1位神奈川県（2.2％）、最下位高知県（0.9％）で2.4倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
