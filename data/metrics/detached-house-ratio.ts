import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const detachedHouseRatio: MetricConfig = {
  "key": "detached-house-ratio",
  "title": "一戸建住宅比率",
  "unit": "％",
  "category": "construction",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010208",
    "cdCat01": "#H01401",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2023,
    "to": 2023,
  },
  "yearFormat": "calendar",
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
  "seoTitle": "一戸建住宅比率ランキング都道府県【2023年】｜1位秋田県（79.4％）",
  "seoDescription": "2023年の一戸建住宅比率の都道府県別ランキング。1位秋田県（79.4％）、最下位東京都（26.3％）で3.0倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
