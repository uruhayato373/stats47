import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const nonAgriculturalIncomeRatio: MetricConfig = {
  "key": "non-agricultural-income-ratio",
  "title": "農外所得割合",
  "unit": "％",
  "category": "economy",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010212",
    "cdCat01": "#L0110102",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2001,
    "to": 2003,
  },
  "yearExclusions": [
    {
      "years": [
        1985,
        1990,
        1995,
        1996,
        1997,
        1998,
        1999,
        2000,
      ],
      "reason": "2026-10 の移行時に当時の years から引き継いだ除外 (まだ判断していない。根拠が無ければ外して年を戻す)",
    },
  ],
  "yearFormat": "fiscal",
  "visualization": {
    ...DEFAULT_METRIC_PRESENTATION,
    "colorScheme": "interpolateGreens",
    "colorSchemeType": "sequential",
  },
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 1,
  },
  "calculation": {
    "isCalculated": false,
  },
  "seoTitle": "農外所得割合ランキング都道府県【2003年】｜1位東京都（79.8％）",
  "seoDescription": "2003年の農外所得割合の都道府県別ランキング。1位東京都（79.8％）、最下位北海道（15.1％）で5.3倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
