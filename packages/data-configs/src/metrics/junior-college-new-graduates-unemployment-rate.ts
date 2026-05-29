import type { MetricConfig } from "../types";

export const juniorCollegeNewGraduatesUnemploymentRate: MetricConfig = {
  "key": "junior-college-new-graduates-unemployment-rate",
  "title": "短大新規卒業者の無業者率",
  "unit": "％",
  "category": "educationsports",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010206",
    "cdCat01": "#F03401",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "years": [
      1979,
      1980,
      1981,
      1982,
      1983,
      1984,
      1985,
      1986,
      1987,
      1988,
      1989,
      1990,
      2023,
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
  "seoTitle": "短大新規卒業者の無業者率ランキング都道府県【2023年】｜1位奈良県（17％）",
  "seoDescription": "2023年の短大新規卒業者の無業者率の都道府県別ランキング。1位奈良県（17％）、最下位宮崎県（0.9％）で18.9倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
  "isFeatured": false,
  "featuredOrder": 0,
};
