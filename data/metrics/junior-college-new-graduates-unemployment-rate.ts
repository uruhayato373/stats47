import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const juniorCollegeNewGraduatesUnemploymentRate: MetricConfig = {
  "key": "junior-college-new-graduates-unemployment-rate",
  "title": "短大新規卒業者の無業者率",
  "unit": "％",
  "category": "educationsports",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010206",
    "cdCat01": "#F03401",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 1979,
    "to": 2023,
  },
  "yearExclusions": [
    {
      "years": [
        1975,
        1976,
        1977,
        1978,
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
  "seoTitle": "短大新規卒業者の無業者率ランキング都道府県【2023年】｜1位奈良県（17％）",
  "seoDescription": "2023年の短大新規卒業者の無業者率の都道府県別ランキング。1位奈良県（17％）、最下位宮崎県（0.9％）で18.9倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
