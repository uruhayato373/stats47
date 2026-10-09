import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const nationalHealthInsuranceVisitRatePer1000: MetricConfig = {
  "key": "national-health-insurance-visit-rate-per-1000",
  "title": "国民健康保険受診率",
  "unit": "被保険者千対",
  "category": "socialsecurity",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010209",
    "cdCat01": "#I15102",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 1995,
    "to": 2023,
  },
  "yearExclusions": [
    {
      "years": [
        1985,
        1986,
        1987,
        1988,
        1989,
        1990,
        1991,
        1992,
        1993,
        1994,
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
  "seoTitle": "国民健康保険受診率ランキング都道府県【2023年】｜1位山口県（12,879.53）",
  "seoDescription": "2023年の国民健康保険受診率の都道府県別ランキング。1位山口県（12,879.53）、最下位沖縄県（8,501.27）で1.5倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
