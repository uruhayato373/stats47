import type { MetricConfig } from "../types";

export const finalEducationElementaryJuniorHighRatio: MetricConfig = {
  "key": "final-education-elementary-junior-high-ratio",
  "title": "最終学歴が小学・中学卒の者の割合",
  "unit": "％",
  "category": "educationsports",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010205",
    "cdCat01": "#E09501",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "years": [
      1980,
      1990,
      2000,
      2010,
      2020,
    ],
  },
  "yearFormat": "fiscal",
  "visualization": {
    "colorScheme": "interpolateBlues",
    "colorSchemeType": "sequential",
    "minValueType": "data-min",
  },
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 1,
  },
  "calculation": {
    "isCalculated": false,
  },
  "seoTitle": "最終学歴が小学・中学卒の者の割合ランキング都道府県【2020年】｜1位青森県（22％）",
  "seoDescription": "2020年の最終学歴が小学・中学卒の者の割合の都道府県別ランキング。1位青森県（22％）、最下位東京都（5.6％）で3.9倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
