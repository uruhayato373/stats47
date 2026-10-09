import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const mediaAvgTimeUnemployedMale: MetricConfig = {
  "key": "media-avg-time-unemployed-male",
  "title": "テレビ・ラジオ・新聞・雑誌の平均時間",
  "subtitle": "男性・非有業者",
  "unit": "分",
  "category": "socialsecurity",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010213",
    "cdCat01": "#M0330102",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2021,
    "to": 2021,
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
  "seoTitle": "テレビ・ラジオ・新聞・雑誌の平均時間（無業者・男）",
  "isActive": true,
};
