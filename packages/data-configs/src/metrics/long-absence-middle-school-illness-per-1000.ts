import type { MetricConfig } from "../types";

export const longAbsenceMiddleSchoolIllnessPer1000: MetricConfig = {
  "key": "long-absence-middle-school-illness-per-1000",
  "title": "病気による中学校長期欠席生徒比率",
  "unit": "生徒千対",
  "category": "educationsports",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010209",
    "cdCat01": "#I0821102",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "years": [
      2002,
      2003,
      2004,
      2005,
      2006,
      2007,
      2008,
      2009,
      2010,
      2011,
      2012,
      2013,
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
  "seoTitle": "病気による中学校長期欠席生徒比率ランキング都道府県【2023年】｜1位岡山県（34.5‐）",
  "seoDescription": "2023年の病気による中学校長期欠席生徒比率の都道府県別ランキング。1位岡山県（34.5‐）、最下位島根県（4.9‐）で7.0倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
