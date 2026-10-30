import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const psychiatricHospitalCountPer100k: MetricConfig = {
  "key": "psychiatric-hospital-count-per-100k",
  "title": "精神科病院数",
  "subtitle": "人口10万人当たり",
  "unit": "施設",
  "category": "socialsecurity",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010209",
    "cdCat01": "#I0910107",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm"
  },
  "entities": [
    "prefecture"
  ],
  "years": {
    "from": 1975,
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
    "decimalPlaces": 1
  },
  "calculation": {
    "isCalculated": false
  },
  "groupKey": "psychiatric-hospital-count",
  "seoTitle": "精神科病院数ランキング都道府県【2023年】｜1位鹿児島県（2.5施設）",
  "seoDescription": "2023年の精神科病院数の都道府県別ランキング。1位鹿児島県（2.5施設）、最下位奈良県（0.3施設）で8.3倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true
};
