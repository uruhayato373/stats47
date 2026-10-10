import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const nurseryUtilizationRate: MetricConfig = {
  "key": "nursery-utilization-rate",
  "title": "保育所等利用率",
  "unit": "％",
  "category": "educationsports",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010205",
    "cdCat01": "#E0910402",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 1984,
    "to": 2020,
  },
  "yearExclusions": [
    {
      "years": [
        1975,
        1976,
        1977,
        1978,
        1979,
        1980,
        1981,
        1982,
        1983,
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
  "seoTitle": "保育所等利用率ランキング都道府県【2020年】｜1位鹿児島県（100.2％）",
  "seoDescription": "2020年の保育所等利用率の都道府県別ランキング。1位鹿児島県（100.2％）、最下位高知県（74.5％）で1.3倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
