import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const employmentInsuranceReceiptRate: MetricConfig = {
  "key": "employment-insurance-receipt-rate",
  "title": "雇用保険受給率",
  "subtitle": "受給実績",
  "unit": "％",
  "category": "socialsecurity",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010206",
    "cdCat01": "#F07101",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 1985,
    "to": 2023,
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
        1984,
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
  "seoTitle": "雇用保険受給率ランキング都道府県【2023年】｜1位奈良県（1.8％）",
  "seoDescription": "2023年の雇用保険受給率の都道府県別ランキング。1位奈良県（1.8％）、最下位東京都（0.4％）で4.5倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
