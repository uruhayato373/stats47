import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const treatmentRateAsthmaInpatient: MetricConfig = {
  "key": "treatment-rate-asthma-inpatient",
  "title": "喘息の受療率（入院）",
  "subtitle": "入院患者の受療率",
  "description": "厚生労働省「患者調査」（2023年）の傷病分類別受療率（人口10万対）。喘息の受療率（入院）のデータ。",
  "unit": "人（人口10万対）",
  "category": "socialsecurity",
  "source": {
    "kind": "estat",
    "statsDataId": "0004026105",
    "cdCat01": "34",
    "cdCat03": "1",
    "areaAxis": {
      "axis": "cat02",
      "scheme": "seq-pref",
    },
    "displayName": "患者調査 第37表 傷病分類別受療率（喘息・入院）",
    "url": "https://www.e-stat.go.jp/dbview?sid=0004026105",
  },
  "entities": [
    "prefecture",
  ],
  visualization: {
    ...DEFAULT_METRIC_PRESENTATION,
    "colorScheme": "interpolateBlues",
    "colorSchemeType": "sequential",
  },
  "years": {
    "from": 2023,
    "to": 2023,
  },
  "yearFormat": "fiscal",
  "calculation": {
    "isCalculated": false,
    "normalizationOptions": [
      {
        "denominator": { "kind": "population", "per": 100000 },
        "unit": "人（人口10万対）/10万人",
        "decimalPlaces": 2,
      },
      {
        "denominator": { "kind": "area", "per": 100 },
        "unit": "人（人口10万対）/100km²",
        "decimalPlaces": 2,
      },
    ],
  },
  "isActive": true,
};
