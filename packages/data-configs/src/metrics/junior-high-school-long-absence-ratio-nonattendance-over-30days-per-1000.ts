import type { MetricConfig } from "../types";

export const juniorHighSchoolLongAbsenceRatioNonattendanceOver30daysPer1000: MetricConfig = {
  "key": "junior-high-school-long-absence-ratio-nonattendance-over-30days-per-1000",
  "title": "不登校による中学校長期欠席生徒比率",
  "unit": "生徒千対",
  "category": "educationsports",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010205",
    "cdCat01": "#E09214",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 1991,
    "to": 2023,
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
  "seoTitle": "不登校による中学校長期欠席生徒比率ランキング都道府県【2023年】｜1位宮城県（84.58‐）",
  "seoDescription": "2023年の不登校による中学校長期欠席生徒比率の都道府県別ランキング。1位宮城県（84.58‐）、最下位福井県（49.73‐）で1.7倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
