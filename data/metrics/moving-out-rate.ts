import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const movingOutRate: MetricConfig = {
  "key": "moving-out-rate",
  "title": "転出率",
  "subtitle": "外国人移動者",
  "unit": "％",
  "category": "population",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010201",
    "cdCat01": "#A05309",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
    "city",
  ],
  "years": {
    "from": 2020,
    "to": 2024,
  },
  "yearExclusions": [
    {
      "years": [
        2014,
        2015,
        2016,
        2017,
        2018,
        2019,
      ],
      "reason": "2026-10 の移行時に当時の years から引き継いだ除外 (まだ判断していない。根拠が無ければ外して年を戻す)",
    },
  ],
  "yearFormat": "fiscal",
  "visualization": {
    ...DEFAULT_METRIC_PRESENTATION,
    "colorScheme": "interpolateBlues",
    "colorSchemeType": "sequential",
    "isReversed": false,
  },
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 2,
  },
  "calculation": {
    "isCalculated": false,
  },
  "seoTitle": "転出率ランキング都道府県【2024年】｜1位東京都（2.7％）",
  "seoDescription": "2024年の転出率の都道府県別ランキング。1位東京都（2.7％）、最下位北海道（1.18％）で2.3倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
