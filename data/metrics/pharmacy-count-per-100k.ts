import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const pharmacyCountPer100k: MetricConfig = {
  "key": "pharmacy-count-per-100k",
  "title": "人口10万人あたり薬局数",
  "unit": "所",
  "category": "socialsecurity",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010209",
    "cdCat01": "#I14101",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm"
  },
  "entities": [
    "prefecture"
  ],
  "years": {
    "from": 1981,
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
    "decimalPlaces": 1
  },
  "calculation": {
    "isCalculated": false
  },
  "groupKey": "pharmacy-count",
  "seoTitle": "人口10万人あたり薬局数ランキング都道府県【2023年】｜1位佐賀県（64.5所）",
  "seoDescription": "2023年の人口10万人あたり薬局数の都道府県別ランキング。1位佐賀県（64.5所）、最下位沖縄県（39.4所）で1.6倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true
};
