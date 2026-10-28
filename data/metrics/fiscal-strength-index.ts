import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const fiscalStrengthIndex: MetricConfig = {
  "key": "fiscal-strength-index",
  "title": "財政力指数",
  "subtitle": "市町村財政",
  "unit": "指数",
  "category": "administrativefinancial",
  "source": {
    "kind": "estat",
    "statsDataId": "0000020204",
    "cdCat01": "D2201",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "city",
  ],
  "years": {
    "from": 1980,
    "to": 2022,
  },
  "yearFormat": "fiscal",
  "visualization": {
    ...DEFAULT_METRIC_PRESENTATION,
    "colorScheme": "interpolateBlues",
    "colorSchemeType": "sequential",
  },
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 0,
  },
  "calculation": {
    "isCalculated": false,
  },
  "seoTitle": "財政力指数ランキング市区町村【2022年】｜1位愛知県 飛島村（2.02）",
  "seoDescription": "2022年の財政力指数の市区町村別ランキング。1位愛知県 飛島村（2.02）、最下位鹿児島県 三島村（0.06）で地図やグラフで市区町村を比較。",
  "isActive": true,
};
