import type { MetricConfig } from "../types";

export const elementarySchoolLongAbsenceRatioNonattendanceOver30daysPer1000: MetricConfig = {
  "key": "elementary-school-long-absence-ratio-nonattendance-over-30days-per-1000",
  "title": "不登校による小学校長期欠席児童比率",
  "unit": "‐",
  "category": "educationsports",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010205",
    "cdCat01": "#E09213",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "years": [
      2000,
      2001,
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
    "decimalPlaces": 2,
  },
  "calculation": {
    "isCalculated": false,
  },
  "seoTitle": "不登校による小学校長期欠席児童比率ランキング都道府県【2023年】｜1位沖縄県（32.69‐）",
  "seoDescription": "2023年の不登校による小学校長期欠席児童比率の都道府県別ランキング。1位沖縄県（32.69‐）、最下位福井県（14.5‐）で2.3倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
  "isFeatured": false,
  "featuredOrder": 0,
};
