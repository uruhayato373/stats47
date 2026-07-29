import type { MetricConfig } from "../types";

export const finalEducationJuniorCollegeTechnicalCollegeRatio: MetricConfig = {
  "key": "final-education-junior-college-technical-college-ratio",
  "title": "最終学歴が短大・高専卒の者の割合",
  "unit": "％",
  "category": "educationsports",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010205",
    "cdCat01": "#E09503",
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
  "seoTitle": "最終学歴が短大・高専卒の者の割合ランキング都道府県【2020年】｜1位長野県（16.9％）",
  "seoDescription": "2020年の最終学歴が短大・高専卒の者の割合の都道府県別ランキング。1位長野県（16.9％）、最下位秋田県（11.3％）で1.5倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
