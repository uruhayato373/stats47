import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const outpatientRatePer100k: MetricConfig = {
  "key": "outpatient-rate-per-100k",
  "title": "外来受療率",
  "subtitle": "人口10万人当たり",
  "denominator": { "kind": "population", "per": 100000 },
  "unit": "人",
  "category": "socialsecurity",
  "source": {
    "kind": "estat",
    "statsDataId": "0004026104",
    "cdCat01": "1",
    "cdCat02": "1",
    "cdCat04": "4",
    "areaAxis": {
      "axis": "cat03",
      "scheme": "seq-pref",
    },
    "displayName": "患者調査",
    "url": "https://www.mhlw.go.jp/toukei/saikin/hw/kanja/23/index.html",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2023,
    "to": 2023,
  },
  "yearFormat": "calendar",
  "visualization": {
    ...DEFAULT_METRIC_PRESENTATION,
    "colorScheme": "interpolateBlues",
    "colorSchemeType": "sequential",
    domain: { mode: "zero" },
  },
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 0,
  },
  "calculation": {
    "isCalculated": false,
    "normalizationOptions": [
      {
        "denominator": { "kind": "population", "per": 100000 },
        "unit": "人/10万人",
        "decimalPlaces": 1,
      },
      {
        "denominator": { "kind": "area", "per": 100 },
        "unit": "人/100km²",
        "decimalPlaces": 2,
      },
    ],
  },
  "seoTitle": "外来受療率1位は和歌山6,846人/10万、沖縄の1.5倍｜47都道府県2023",
  "isActive": true,
};
