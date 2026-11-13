import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const retailStoresPer: MetricConfig = {
  "key": "retail-stores-per",
  "title": "小売店数",
  "subtitle": "市区町村・人口当たり",
  "unit": "店",
  "category": "commercial",
  "source": {
    "kind": "estat",
    "statsDataId": "0000020308",
    "cdCat01": "#H06101",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "city",
  ],
  "years": {
    "from": 2006,
    "to": 2006,
  },
  "yearFormat": "calendar",
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
  "groupKey": "retail-stores-per",
  "seoTitle": "小売店数ランキング市区町村【2006年】｜1位東京都 千代田区（86.65店）",
  "seoDescription": "2006年の小売店数の市区町村別ランキング。1位東京都 千代田区（86.65店）、最下位大阪府 豊能町（2.93店）で地図やグラフで市区町村を比較。",
  "isActive": true,
};
