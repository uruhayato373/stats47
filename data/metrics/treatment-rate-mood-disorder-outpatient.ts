import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const treatmentRateMoodDisorderOutpatient: MetricConfig = {
  "key": "treatment-rate-mood-disorder-outpatient",
  "title": "気分障害（うつ病を含む）の受療率（外来）",
  "subtitle": "外来患者の受療率",
  "description": "厚生労働省「患者調査」（2023年）の傷病分類別受療率（人口10万対）。気分障害（うつ病を含む）の受療率（外来）のデータ。",
  "unit": "人（人口10万対）",
  "category": "socialsecurity",
  "source": {
    "kind": "estat",
    "statsDataId": "0004026105",
    "cdCat01": "18",
    "cdCat03": "4",
    "areaAxis": {
      "axis": "cat02",
      "scheme": "seq-pref"
    },
    "displayName": "患者調査 第37表 傷病分類別受療率（気分障害・外来）",
    "url": "https://www.e-stat.go.jp/dbview?sid=0004026105"
  },
  "entities": [
    "prefecture"
  ],
  visualization: {
    ...DEFAULT_METRIC_PRESENTATION,
    "colorScheme": "interpolateBlues",
    "colorSchemeType": "sequential",
  },
  "years": {
    "from": 2023,
    "to": 2023
  },
  "yearFormat": "fiscal",
  "calculation": {
    "isCalculated": false
  },
  "isActive": true
};
