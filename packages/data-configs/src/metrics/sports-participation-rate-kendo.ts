import type { MetricConfig } from "../types";

export const sportsParticipationRateKendo: MetricConfig = {
  "key": "sports-participation-rate-kendo",
  "title": "剣道の行動者率",
  "unit": "％",
  "category": "educationsports",
  "source": {
    "kind": "estat",
    "statsDataId": "0003456409",
    "cdCat03": "12",
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
  "seoTitle": "剣道の行動者率 都道府県ランキング【2021年】｜1位山形県（0.9％）",
  "seoDescription": "2021年の剣道の行動者率を都道府県別に比較。1位は山形県（0.9％）、最下位は徳島県（0.2％）、最大と最小の差は4.5倍です。地図やグラフで47都道府県の違いを確認できます。",
  "isActive": true,
};
