import type { MetricConfig } from "../types";

export const studyParticipationRateBusinessSkills: MetricConfig = {
  "key": "study-participation-rate-business-skills",
  "title": "商業実務・ビジネス関係（情報処理除く）の行動者率",
  "subtitle": "ビジネス技能関係",
  "unit": "％",
  "category": "educationsports",
  "source": {
    "kind": "estat",
    "statsDataId": "0003456245",
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
  "seoTitle": "商業実務・ビジネス関係（情報処理除く）の行動者率ランキング都道府県【2021年】｜1位東京都（13.1％）",
  "seoDescription": "2021年の商業実務・ビジネス関係（情報処理除く）の行動者率の都道府県別ランキング。1位東京都（13.1％）、最下位宮崎県（4.8％）で2.7倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
