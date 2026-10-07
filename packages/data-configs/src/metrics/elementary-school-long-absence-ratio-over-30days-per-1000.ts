import type { MetricConfig } from "../types";

export const elementarySchoolLongAbsenceRatioOver30daysPer1000: MetricConfig = {
  "key": "elementary-school-long-absence-ratio-over-30days-per-1000",
  "title": "小学校長期欠席児童比率",
  "unit": "児童千対",
  "category": "educationsports",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010205",
    "cdCat01": "#E09211",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2000,
    "to": 2023,
  },
  "yearExclusions": [
    {
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
      ],
      "reason": "2026-10 の移行時に当時の years から引き継いだ除外 (まだ判断していない。根拠が無ければ外して年を戻す)",
    },
  ],
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
  "seoTitle": "小学校長期欠席児童比率ランキング都道府県【2023年】｜1位沖縄県（56.51‐）",
  "seoDescription": "2023年の小学校長期欠席児童比率の都道府県別ランキング。1位沖縄県（56.51‐）、最下位徳島県（22‐）で2.6倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
