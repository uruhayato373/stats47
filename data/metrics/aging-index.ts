import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const agingIndex: MetricConfig = {
  "key": "aging-index",
  "title": "老年化指数",
  "unit": "指数",
  "category": "socialsecurity",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010201",
    "cdCat01": "#A03404",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm"
  },
  "entities": [
    "prefecture"
  ],
  "years": {
    "from": 2022,
    "to": 2022
  },
  "yearFormat": "calendar",
  "visualization": {
    ...DEFAULT_METRIC_PRESENTATION,
    "colorScheme": "interpolateBlues",
    "colorSchemeType": "sequential",
    "isReversed": false,
  },
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 1
  },
  "calculation": {
    "isCalculated": false
  },
  "seoTitle": "老年化指数ランキング都道府県【2022年】｜1位秋田県（417.4）",
  "seoDescription": "2022年の老年化指数の都道府県別ランキング。1位秋田県（417.4）、最下位沖縄県（143.3）で2.9倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
  "subtitle": "15歳未満人口100人当たり"
};
