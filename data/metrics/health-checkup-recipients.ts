import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const healthCheckupRecipients: MetricConfig = {
  "key": "health-checkup-recipients",
  "title": "生活習慣病健康診断受診延人員（都道府県別）",
  "unit": "人",
  "category": "socialsecurity",
  "source": {
    "kind": "estat",
    "statsDataId": "0004027740",
    "cdCat01": "100",
    "cdCat02": "180",
    "displayName": "生活習慣病健康診断受診延人員（都道府県別・2020年度）",
    "url": "https://www.e-stat.go.jp/dbview?sid=0004027740",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2020,
    "to": 2020,
  },
  "yearFormat": "fiscal",
  "visualization": {
    ...DEFAULT_METRIC_PRESENTATION,
    "colorScheme": "interpolateBlues",
    "colorSchemeType": "sequential",
    domain: { mode: "zero" },
  },
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 1,
  },
  "isActive": true,
};
