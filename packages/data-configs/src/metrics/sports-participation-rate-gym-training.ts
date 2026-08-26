import type { MetricConfig } from "../types";

export const sportsParticipationRateGymTraining: MetricConfig = {
  "key": "sports-participation-rate-gym-training",
  "title": "器具を使ったトレーニングの行動者率",
  "unit": "％",
  "category": "educationsports",
  "source": {
    "kind": "estat",
    "statsDataId": "0003456409",
    "cdCat03": "22",
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
  "seoTitle": "器具を使ったトレーニングの行動者率 都道府県ランキング【2021年】｜1位東京都（15.0％）",
  "seoDescription": "2021年の器具を使ったトレーニングの行動者率を都道府県別に比較。1位は東京都（15.0％）、最下位は長崎県（8.3％）、最大と最小の差は1.8倍です。地図やグラフで47都道府県の違いを確認できます。",
  "isActive": true,
};
