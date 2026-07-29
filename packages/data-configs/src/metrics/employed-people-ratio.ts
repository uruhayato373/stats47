import type { MetricConfig } from "../types";

export const employedPeopleRatio: MetricConfig = {
  "key": "employed-people-ratio",
  "title": "就業者比率",
  "unit": "％",
  "category": "laborwage",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010206",
    "cdCat01": "#F01102",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
    "city",
  ],
  "years": {
    "years": [
      2000,
      2005,
      2010,
      2015,
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
  "seoTitle": "就業者比率ランキング都道府県【2020年】｜1位島根県（97.3％）",
  "seoDescription": "2020年の就業者比率の都道府県別ランキング。1位島根県（97.3％）、最下位沖縄県（94.5％）で1.0倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
