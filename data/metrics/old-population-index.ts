import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const oldPopulationIndex: MetricConfig = {
  "key": "old-population-index",
  "title": "老年人口指数",
  "description": "65歳以上人口を15～64歳人口で除し、100を掛けた指数です。",
  "unit": "指数",
  "category": "population",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010201",
    "cdCat01": "#A03402",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm"
  },
  "entities": [
    "prefecture"
  ],
  "years": {
    "from": 1977,
    "to": 2022,
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
  "seoTitle": "老年人口指数ランキング都道府県【2022年】｜1位秋田県（74.2）",
  "seoDescription": "2022年の老年人口指数の都道府県別ランキング。1位秋田県（74.2）、最下位東京都（34.4）で2.2倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
  "subtitle": "15～64歳人口100人当たり"
};
