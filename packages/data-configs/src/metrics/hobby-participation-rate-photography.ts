import type { MetricConfig } from "../types";

export const hobbyParticipationRatePhotography: MetricConfig = {
  "key": "hobby-participation-rate-photography",
  "title": "写真の撮影・プリントの行動者率",
  "unit": "％",
  "category": "educationsports",
  "source": {
    "kind": "estat",
    "statsDataId": "0003456573",
    "cdCat03": "25",
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
    "colorScheme": "interpolateBlues",
    "colorSchemeType": "sequential",
    "minValueType": "data-min",
  },
  "display": {
    "decimalPlaces": 1,
  },
  "calculation": {
    "isCalculated": false,
  },
  "seoTitle": "写真の撮影・プリントの行動者率ランキング都道府県【2021年】｜1位東京都（27.2％）",
  "seoDescription": "2021年の写真の撮影・プリントの行動者率の都道府県別ランキング。1位東京都（27.2％）、最下位青森県（14.6％）で1.9倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
