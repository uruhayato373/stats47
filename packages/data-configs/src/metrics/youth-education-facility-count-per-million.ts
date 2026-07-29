import type { MetricConfig } from "../types";

export const youthEducationFacilityCountPerMillion: MetricConfig = {
  "key": "youth-education-facility-count-per-million",
  "title": "青少年教育施設数",
  "unit": "所",
  "category": "educationsports",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010207",
    "cdCat01": "#G01109",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "years": [
      1993,
      1996,
      1999,
      2002,
      2005,
      2008,
      2011,
      2015,
      2018,
      2021,
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
    "normalizationOptions": [
      {
        "type": "per_population",
        "label": "人口10万人あたり",
        "unit": "所/10万人",
        "scaleFactor": 100000,
        "decimalPlaces": 1,
      },
      {
        "type": "per_area",
        "label": "面積100km²あたり",
        "unit": "所/100km²",
        "scaleFactor": 100,
        "decimalPlaces": 2,
      },
    ],
  },
  "seoTitle": "青少年教育施設数ランキング都道府県【2021年】｜1位鳥取県（20所）",
  "seoDescription": "2021年の青少年教育施設数の都道府県別ランキング。1位鳥取県（20所）、最下位埼玉県（2.5所）で8.0倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
