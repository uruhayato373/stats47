import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

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
    "from": 2002,
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
        2000,
        2001,
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
  },
  "seoTitle": "病気による中学校長期欠席生徒比率ランキング都道府県【2023年】｜1位岡山県（34.5）",
  "seoDescription": "2023年の病気による中学校長期欠席生徒比率の都道府県別ランキング。1位岡山県（34.5）、最下位島根県（4.9）で7.0倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
