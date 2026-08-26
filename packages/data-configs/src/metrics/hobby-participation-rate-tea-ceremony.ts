import type { MetricConfig } from "../types";

export const hobbyParticipationRateTeaCeremony: MetricConfig = {
  "key": "hobby-participation-rate-tea-ceremony",
  "title": "茶道の行動者率",
  "unit": "％",
  "category": "educationsports",
  "source": {
    "kind": "estat",
    "statsDataId": "0003456573",
    "cdCat03": "17",
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
  "seoTitle": "茶道の行動者率 都道府県ランキング【2021年】｜1位富山県（1.3％）",
  "seoDescription": "2021年の茶道の行動者率を都道府県別に比較。1位は富山県（1.3％）、最下位は沖縄県（0.5％）、最大と最小の差は2.6倍です。地図やグラフで47都道府県の違いを確認できます。",
  "isActive": true,
};
