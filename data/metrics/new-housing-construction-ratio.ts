import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const newHousingConstructionRatio: MetricConfig = {
  "key": "new-housing-construction-ratio",
  "title": "着工新設住宅比率",
  "unit": "％",
  "category": "construction",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010208",
    "cdCat01": "#H01204",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2009,
    "to": 2024,
  },
  "yearExclusions": [
    {
      "years": [
        1980,
        1985,
        1990,
        1995,
        2000,
        2003,
        2004,
        2005,
        2006,
        2007,
        2008,
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
  "seoTitle": "着工新設住宅比率ランキング都道府県【2024年】｜1位熊本県（2.1％）",
  "seoDescription": "2024年の着工新設住宅比率の都道府県別ランキング。1位熊本県（2.1％）、最下位高知県（0.7％）で3.0倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
