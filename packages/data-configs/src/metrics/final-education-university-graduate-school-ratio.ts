import type { MetricConfig } from "../types";

export const finalEducationUniversityGraduateSchoolRatio: MetricConfig = {
  "key": "final-education-university-graduate-school-ratio",
  "title": "最終学歴が大学・大学院卒の者の割合",
  "description": "最終学歴人口の卒業者総数に占める、最終学歴が大学または大学院である人の割合です。",
  "unit": "％",
  "category": "educationsports",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010205",
    "cdCat01": "#E09504",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "years": [
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
  "seoTitle": "最終学歴が大学・大学院卒の者の割合ランキング都道府県【2020年】｜1位東京都（31.6％）",
  "seoDescription": "2020年の最終学歴が大学・大学院卒の者の割合の都道府県別ランキング。1位東京都（31.6％）、最下位青森県（11.8％）で2.7倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
