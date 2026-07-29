import type { MetricConfig } from "../types";

export const nursesInMedicalFacilitiesPer100k: MetricConfig = {
  "key": "nurses-in-medical-facilities-per-100k",
  "title": "看護師・准看護師数",
  "subtitle": "医療施設に従事する数",
  "unit": "人",
  "category": "socialsecurity",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010209",
    "cdCat01": "#I0920301",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "years": [
      2002,
      2004,
      2006,
      2008,
      2010,
      2012,
      2014,
      2016,
      2018,
      2020,
      2022,
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
        "unit": "人/10万人",
        "scaleFactor": 100000,
        "decimalPlaces": 1,
      },
      {
        "type": "per_area",
        "label": "面積100km²あたり",
        "unit": "人/100km²",
        "scaleFactor": 100,
        "decimalPlaces": 2,
      },
    ],
  },
  "seoTitle": "看護師・准看護師数ランキング都道府県【2022年】｜1位高知県（1,631.5人）",
  "seoDescription": "2022年の看護師・准看護師数の都道府県別ランキング。1位高知県（1,631.5人）、最下位埼玉県（704.7人）で2.3倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
