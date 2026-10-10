import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const privateAutoInsurancePenetrationRatePerson: MetricConfig = {
  "key": "private-auto-insurance-penetration-rate-person",
  "title": "任意自動車保険普及率",
  "subtitle": "対人賠償",
  "unit": "％",
  "category": "economy",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010211",
    "cdCat01": "#K10502",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 1977,
    "to": 2023,
  },
  "yearExclusions": [
    {
      "years": [
        1975,
        1976,
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
    "decimalPlaces": 1,
  },
  "calculation": {
    "isCalculated": false,
  },
  "seoTitle": "任意自動車保険普及率ランキング都道府県【2023年】｜1位大阪府（82.8％）",
  "seoDescription": "2023年の任意自動車保険普及率の都道府県別ランキング。1位大阪府（82.8％）、最下位沖縄県（55％）で1.5倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
