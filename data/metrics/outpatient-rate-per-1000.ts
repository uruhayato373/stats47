import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const outpatientRatePer1000: MetricConfig = {
  "key": "outpatient-rate-per-1000",
  "title": "通院者率",
  "subtitle": "国民生活基礎調査",
  "unit": "人口千対",
  "category": "socialsecurity",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010209",
    "cdCat01": "#I04104",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "years": [
      1995,
      1998,
      2001,
      2004,
      2007,
      2010,
      2013,
      2016,
      2019,
      2022,
    ],
  },
  "yearExclusions": [
    {
      "years": [
        1989,
        1992,
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
  "groupKey": "outpatient-count",
  "seoTitle": "通院者率ランキング都道府県【2022年】｜1位秋田県（496.2）",
  "seoDescription": "2022年の通院者率の都道府県別ランキング。1位秋田県（496.2）、最下位沖縄県（358.5）で1.4倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
