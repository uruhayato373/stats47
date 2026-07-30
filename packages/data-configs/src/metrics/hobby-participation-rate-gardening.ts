import type { MetricConfig } from "../types";

export const hobbyParticipationRateGardening: MetricConfig = {
  "key": "hobby-participation-rate-gardening",
  "title": "園芸・庭いじり・ガーデニングの行動者率",
  "unit": "％",
  "category": "educationsports",
  "source": {
    "kind": "estat",
    "statsDataId": "0003456573",
    "cdCat03": "21",
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
  "seoTitle": "園芸・庭いじり・ガーデニングの行動者率ランキング都道府県【2021年】｜1位群馬県（32.8％）",
  "seoDescription": "2021年の園芸・庭いじり・ガーデニングの行動者率の都道府県別ランキング。1位群馬県（32.8％）、最下位大阪府（19.5％）で1.7倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
