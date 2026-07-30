import type { MetricConfig } from "../types";

export const hobbyParticipationRateSewing: MetricConfig = {
  "key": "hobby-participation-rate-sewing",
  "title": "和裁・洋裁の行動者率",
  "unit": "％",
  "category": "educationsports",
  "source": {
    "kind": "estat",
    "statsDataId": "0003456573",
    "cdCat03": "18",
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
  "seoTitle": "和裁・洋裁の行動者率ランキング都道府県【2021年】｜1位神奈川県（6.3％）",
  "seoDescription": "2021年の和裁・洋裁の行動者率の都道府県別ランキング。1位神奈川県（6.3％）、最下位愛媛県（4.1％）で1.5倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
