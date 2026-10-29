import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const juniorCollegeCapacityIndex: MetricConfig = {
  "key": "junior-college-capacity-index",
  "title": "短期大学収容力指数",
  "unit": "指数",
  "category": "educationsports",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010205",
    "cdCat01": "#E0610201",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 1976,
    "to": 2024,
  },
  "yearFormat": "fiscal",
  "visualization": {
    ...DEFAULT_METRIC_PRESENTATION,
    "colorScheme": "interpolateRdBu",
    "colorSchemeType": "diverging",
    "divergingMidpoint": "custom",
    "divergingMidpointValue": 100,
    "isReversed": false,
    "isSymmetrized": false,
  },
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 1,
  },
  "calculation": {
    "isCalculated": false,
  },
  "seoTitle": "短期大学収容力指数ランキング都道府県【2024年】｜1位東京都（241.1）",
  "seoDescription": "2024年の短期大学収容力指数の都道府県別ランキング。1位東京都（241.1）、最下位和歌山県（45.5）で5.3倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
