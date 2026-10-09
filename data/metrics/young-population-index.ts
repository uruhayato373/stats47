import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const youngPopulationIndex: MetricConfig = {
  "key": "young-population-index",
  "title": "年少人口指数",
  "description": "15歳未満人口を15～64歳人口で除し、100を掛けた指数です。",
  "unit": "指数",
  "category": "population",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010201",
    "cdCat01": "#A03401",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm"
  },
  "entities": [
    "prefecture"
  ],
  "years": {
    "from": 1983,
    "to": 2022,
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
      ],
      "reason": "2026-10 の移行時に当時の years から引き継いだ除外 (まだ判断していない。根拠が無ければ外して年を戻す)",
    },
  ],
  "yearFormat": "calendar",
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
  "seoTitle": "年少人口指数ランキング都道府県【2022年】｜1位沖縄県（27.1）",
  "seoDescription": "2022年の年少人口指数の都道府県別ランキング。1位沖縄県（27.1）、最下位東京都（16.5）で1.6倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
  "subtitle": "15～64歳人口100人当たり"
};
