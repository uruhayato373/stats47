import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const studyParticipationRateBusiness: MetricConfig = {
  "key": "study-participation-rate-business",
  "title": "商業実務・ビジネス関係の行動者率",
  "subtitle": "商業実務関係",
  "unit": "％",
  "category": "educationsports",
  "source": {
    "kind": "estat",
    "statsDataId": "0003456245",
    "cdCat03": "2",
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
  "seoTitle": "商業実務・ビジネス関係の行動者率ランキング都道府県【2021年】｜1位東京都（29.2％）",
  "seoDescription": "2021年の商業実務・ビジネス関係の行動者率の都道府県別ランキング。1位東京都（29.2％）、最下位青森県（12.7％）で2.3倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
