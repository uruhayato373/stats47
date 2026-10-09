import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const elderlyGeneralWorkerOldPopulationRatioPre2019: MetricConfig = {
  "key": "elderly-general-worker-old-population-ratio-pre2019",
  "title": "高齢一般労働者割合",
  "subtitle": "〜2018年",
  "unit": "％",
  "category": "laborwage",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010206",
    "cdCat01": "#F0350403",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 1982,
    "to": 2019,
  },
  "yearExclusions": [
    {
      "years": [
        1978,
        1979,
        1980,
        1981,
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
    "decimalPlaces": 2,
  },
  "calculation": {
    "isCalculated": false,
  },
  "seoTitle": "高齢一般労働者割合ランキング都道府県【2019年】｜1位東京都（3.33％）",
  "seoDescription": "2019年の高齢一般労働者割合の都道府県別ランキング。1位東京都（3.33％）、最下位奈良県（1.07％）で3.1倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
