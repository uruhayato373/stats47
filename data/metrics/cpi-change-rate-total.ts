import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const cpiChangeRateTotal: MetricConfig = {
  "key": "cpi-change-rate-total",
  "title": "消費者物価指数変化率",
  "subtitle": "総合",
  "unit": "％",
  "category": "economy",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010212",
    "cdCat01": "#L04101",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 1979,
    "to": 2024,
  },
  "yearExclusions": [
    {
      "years": [
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
    "colorScheme": "interpolateRdBu",
    "colorSchemeType": "diverging",
    "divergingMidpoint": "zero",
    "isReversed": false,
    "isSymmetrized": false,
  },
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 1,
  },
  "calculation": {
    "isCalculated": false,
  },
  "seoTitle": "消費者物価指数変化率ランキング都道府県【2024年】｜1位奈良県（3.5％）",
  "seoDescription": "2024年の消費者物価指数変化率の都道府県別ランキング。1位奈良県（3.5％）、最下位和歌山県（2.2％）で1.6倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
