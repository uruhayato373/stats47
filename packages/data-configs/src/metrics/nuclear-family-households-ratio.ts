import type { MetricConfig } from "../types";

export const nuclearFamilyHouseholdsRatio: MetricConfig = {
  "key": "nuclear-family-households-ratio",
  "title": "核家族世帯割合",
  "description": "一般世帯に占める、夫婦のみ・夫婦と子・ひとり親と子からなる核家族世帯の割合。",
  "unit": "％",
  "category": "population",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010201",
    "cdCat01": "#A06202",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
    "city",
  ],
  "years": {
    "years": [
      1985,
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
  "seoTitle": "核家族世帯割合ランキング都道府県【2020年】｜1位奈良県（62.59％）",
  "seoDescription": "2020年の核家族世帯割合の都道府県別ランキング。1位奈良県（62.59％）、最下位東京都（45.72％）で1.4倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
