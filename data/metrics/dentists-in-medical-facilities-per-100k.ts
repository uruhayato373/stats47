import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const dentistsInMedicalFacilitiesPer100k: MetricConfig = {
  "key": "dentists-in-medical-facilities-per-100k",
  "title": "歯科医師数",
  "subtitle": "医療施設に従事する数",
  "unit": "人",
  "category": "socialsecurity",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010209",
    "cdCat01": "#I0920201",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "years": [
      1990,
      1992,
      1994,
      1996,
      1998,
      2000,
      2002,
      2004,
      2006,
      2008,
      2010,
      2012,
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
        2014,
        2016,
        2018,
        2020,
      ],
      "reason": "2026-10 の移行時に当時の years から引き継いだ除外 (まだ判断していない。根拠が無ければ外して年を戻す)",
    },
  ],
  "yearFormat": "fiscal",
  "visualization": {
    ...DEFAULT_METRIC_PRESENTATION,
    "colorScheme": "interpolateBlues",
    "colorSchemeType": "sequential",
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
  "groupKey": "dentists-in-medical-facilities",
  "seoTitle": "歯科医師数ランキング都道府県【2022年】｜1位東京都（116.1人）",
  "seoDescription": "2022年の歯科医師数の都道府県別ランキング。1位東京都（116.1人）、最下位青森県（55.9人）で2.1倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
