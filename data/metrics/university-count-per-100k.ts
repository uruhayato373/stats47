import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const universityCountPer100k: MetricConfig = {
  "key": "university-count-per-100k",
  "title": "大学数",
  "subtitle": "人口10万人当たり",
  "unit": "校",
  "category": "educationsports",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010205",
    "cdCat01": "#E0610102",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 1975,
    "to": 2024,
  },
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
  "groupKey": "university-count",
  "seoTitle": "大学数ランキング都道府県【2024年】｜1位京都府（1.35校）",
  "seoDescription": "2024年の大学数の都道府県別ランキング。1位京都府（1.35校）、最下位佐賀県（0.25校）で5.4倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
