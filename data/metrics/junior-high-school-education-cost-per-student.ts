import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const juniorHighSchoolEducationCostPerStudent: MetricConfig = {
  "key": "junior-high-school-education-cost-per-student",
  "title": "中学校教育費",
  "subtitle": "生徒1人当たり",
  "unit": "円",
  "category": "educationsports",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010205",
    "cdCat01": "#E10103",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 1975,
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
  "seoTitle": "中学校教育費ランキング都道府県【2022年】｜1位徳島県（1,837,025円）",
  "seoDescription": "2022年の中学校教育費の都道府県別ランキング。1位徳島県（1,837,025円）、最下位神奈川県（945,954円）で1.9倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
