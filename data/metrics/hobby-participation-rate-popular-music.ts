import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const hobbyParticipationRatePopularMusic: MetricConfig = {
  "key": "hobby-participation-rate-popular-music",
  "title": "ポピュラー音楽鑑賞の行動者率",
  "unit": "％",
  "category": "educationsports",
  "source": {
    "kind": "estat",
    "statsDataId": "0003456573",
    "cdCat03": "07",
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
  "seoTitle": "ポピュラー音楽鑑賞の行動者率ランキング都道府県【2021年】｜1位東京都（8.3％）",
  "seoDescription": "2021年のポピュラー音楽鑑賞の行動者率の都道府県別ランキング。1位東京都（8.3％）、最下位沖縄県（2.4％）で3.5倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
