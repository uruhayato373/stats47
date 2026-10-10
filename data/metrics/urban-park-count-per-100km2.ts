import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const urbanParkCountPer100km2: MetricConfig = {
  "key": "urban-park-count-per-100km2",
  "title": "都市公園数",
  "subtitle": "面積100km²当たり",
  "unit": "所",
  "category": "infrastructure",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010208",
    "cdCat01": "#H08301",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 1981,
    "to": 2023,
  },
  "yearExclusions": [
    {
      "years": [
        1975,
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
    "decimalPlaces": 2,
  },
  "calculation": {
    "isCalculated": false,
    "normalizationOptions": [
      {
        "type": "per_population",
        "label": "人口10万人あたり",
        "unit": "所/10万人",
        "scaleFactor": 100000,
        "decimalPlaces": 1,
      },
      {
        "type": "per_area",
        "label": "面積100km²あたり",
        "unit": "所/100km²",
        "scaleFactor": 100,
        "decimalPlaces": 2,
      },
    ],
  },
  "groupKey": "urban-parks",
  "seoTitle": "都市公園数ランキング都道府県【2023年】｜1位東京都（616.79所）",
  "seoDescription": "2023年の都市公園数の都道府県別ランキング。1位東京都（616.79所）、最下位秋田県（18.93所）で32.6倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
