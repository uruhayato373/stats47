import type { MetricConfig } from "../types";

export const elderlyCoupleOnlyHouseholdRatio: MetricConfig = {
  "key": "elderly-couple-only-household-ratio",
  "title": "高齢夫婦のみの世帯の割合",
  "description": "夫が65歳以上、妻が60歳以上の夫婦のみの世帯数を一般世帯数で除して100を掛けた割合です。",
  "unit": "％",
  "category": "population",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010201",
    "cdCat01": "#A06302",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
    "city",
  ],
  "years": {
    "years": [
      1990,
      1995,
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
    "decimalPlaces": 2,
  },
  "calculation": {
    "isCalculated": false,
  },
  "seoTitle": "高齢夫婦のみの世帯の割合ランキング都道府県【2020年】｜1位奈良県（15.94％）",
  "seoDescription": "2020年の高齢夫婦のみの世帯の割合の都道府県別ランキング。1位奈良県（15.94％）、最下位東京都（7.82％）で2.0倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
