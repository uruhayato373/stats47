import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const generalHospitalAvgLengthOfStay: MetricConfig = {
  "key": "general-hospital-avg-length-of-stay",
  "title": "一般病院平均在院日数",
  "unit": "日",
  "category": "socialsecurity",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010209",
    "cdCat01": "#I10105",
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
  "seoTitle": "一般病院平均在院日数ランキング都道府県【2023年】｜1位高知県（34.7日）",
  "seoDescription": "2023年の一般病院平均在院日数の都道府県別ランキング。1位高知県（34.7日）、最下位神奈川県（18.5日）で1.9倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true
};
