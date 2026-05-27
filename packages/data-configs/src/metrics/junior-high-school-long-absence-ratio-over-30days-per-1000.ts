import type { MetricConfig } from "../types";

export const juniorHighSchoolLongAbsenceRatioOver30daysPer1000: MetricConfig = {
  "key": "junior-high-school-long-absence-ratio-over-30days-per-1000",
  "title": "中学校長期欠席生徒比率",
  "unit": "‐",
  "category": "educationsports",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010205",
    "cdCat01": "#E09212",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "years": [
      1991,
      1992,
      1993,
      1994,
      1995,
      1996,
      1997,
      1998,
      1999,
      2000,
      2001,
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
  "seoTitle": "中学校長期欠席生徒比率ランキング都道府県【2023年】｜1位沖縄県（104.65‐）",
  "seoDescription": "2023年の中学校長期欠席生徒比率の都道府県別ランキング。1位沖縄県（104.65‐）、最下位岩手県（65.75‐）で1.6倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
  "isFeatured": false,
  "featuredOrder": 0,
};
