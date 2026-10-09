import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const totalAssessedLandAreaRatio: MetricConfig = {
  "key": "total-assessed-land-area-ratio",
  "title": "評価総地積割合",
  "subtitle": "課税対象土地",
  "unit": "％",
  "category": "administrativefinancial",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010202",
    "cdCat01": "#B01401",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 1978,
    "to": 2023,
  },
  "yearExclusions": [
    {
      "years": [
        1975,
        1976,
        1977,
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
  "seoTitle": "評価総地積割合ランキング都道府県【2023年】｜1位千葉県（68.7％）",
  "seoDescription": "2023年の評価総地積割合の都道府県別ランキング。1位千葉県（68.7％）、最下位山梨県（29.4％）で2.3倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
