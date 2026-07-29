import type { MetricConfig } from "../types";

export const juniorHighSchoolAdvancementRate: MetricConfig = {
  "key": "junior-high-school-advancement-rate",
  "title": "中学校卒業者の進学率",
  "unit": "％",
  "category": "educationsports",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010205",
    "cdCat01": "#E09401",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "years": [
      2006,
      2007,
      2008,
      2009,
      2010,
      2011,
      2012,
      2013,
      2014,
      2015,
      2016,
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
  "seoTitle": "中学校卒業者の進学率ランキング都道府県【2023年】｜1位石川県（96.7％）",
  "seoDescription": "2023年の中学校卒業者の進学率の都道府県別ランキング。1位石川県（96.7％）、最下位愛知県（90.1％）で1.1倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
