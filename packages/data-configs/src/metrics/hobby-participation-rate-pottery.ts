import type { MetricConfig } from "../types";

export const hobbyParticipationRatePottery: MetricConfig = {
  "key": "hobby-participation-rate-pottery",
  "title": "陶芸・工芸の行動者率",
  "unit": "％",
  "category": "educationsports",
  "source": {
    "kind": "estat",
    "statsDataId": "0003456573",
    "cdCat03": "24",
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
  "seoTitle": "陶芸・工芸の行動者率 都道府県ランキング【2021年】｜1位東京都（2.1％）",
  "seoDescription": "2021年の陶芸・工芸の行動者率を都道府県別に比較。1位は東京都（2.1％）、最下位は沖縄県（0.8％）、最大と最小の差は2.6倍です。地図やグラフで47都道府県の違いを確認できます。",
  "isActive": true,
};
