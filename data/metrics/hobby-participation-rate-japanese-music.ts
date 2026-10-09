import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const hobbyParticipationRateJapaneseMusic: MetricConfig = {
  "key": "hobby-participation-rate-japanese-music",
  "title": "邦楽の行動者率",
  "unit": "％",
  "category": "educationsports",
  "source": {
    "kind": "estat",
    "statsDataId": "0003456573",
    "cdCat03": "10",
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
  "seoTitle": "邦楽の行動者率ランキング都道府県【2021年】｜1位沖縄県（5.5％）",
  "seoDescription": "2021年の邦楽の行動者率の都道府県別ランキング。1位沖縄県（5.5％）、最下位徳島県（1.5％）で3.7倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
