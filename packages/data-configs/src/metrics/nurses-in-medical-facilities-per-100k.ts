import type { MetricConfig } from "../types";

export const nursesInMedicalFacilitiesPer100k: MetricConfig = {
  "key": "nurses-in-medical-facilities-per-100k",
  "title": "看護師・准看護師数",
  "subtitle": "医療施設従事者（人口10万人当たり）",
  "unit": "人",
  "category": "socialsecurity",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010209",
    "cdCat01": "#I0920301",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm"
  },
  "entities": [
    "prefecture"
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
  "yearExclusions": [
    {
      "years": [
        1975,
        1976,
        1977,
        1978,
        1979,
        1980,
        1981,
        1982,
        1984,
        1986,
        1988,
        1990,
        1992,
        1994,
        1996,
        1998,
        2000,
      ],
      "reason": "2026-10 の移行時に当時の years から引き継いだ除外 (まだ判断していない。根拠が無ければ外して年を戻す)",
    },
  ],
  "yearFormat": "fiscal",
  "visualization": {
    "colorScheme": "interpolateBlues",
    "colorSchemeType": "sequential",
    "minValueType": "data-min"
  },
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 1
  },
  "calculation": {
    "isCalculated": false
  },
  "seoTitle": "看護師・准看護師数ランキング都道府県【2022年】｜1位高知県（1,631.5人）",
  "seoDescription": "2022年の看護師・准看護師数の都道府県別ランキング。1位高知県（1,631.5人）、最下位埼玉県（704.7人）で2.3倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true
};
