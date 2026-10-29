import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const nationalUniversityStudentRatio: MetricConfig = {
  "key": "national-university-student-ratio",
  "title": "国立大学学生数割合",
  "unit": "％",
  "category": "educationsports",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010205",
    "cdCat01": "#E0620401",
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
    "decimalPlaces": 1,
  },
  "calculation": {
    "isCalculated": false,
  },
  "seoTitle": "国立大学学生数割合ランキング都道府県【2024年】｜1位鳥取県（76.1％）",
  "seoDescription": "2024年の国立大学学生数割合の都道府県別ランキング。1位鳥取県（76.1％）、最下位神奈川県（4.1％）で18.6倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
