import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const averageLengthOfStay: MetricConfig = {
  "key": "average-length-of-stay",
  "title": "平均在院日数",
  "subtitle": "病院の入院患者の平均在院日数",
  "unit": "日",
  "category": "socialsecurity",
  "source": {
    "kind": "estat",
    "statsDataId": "0004045406",
    "cdTab": "310",
    "cdCat01": "100",
    "cdCat02": "100",
    "displayName": "病院報告",
    "url": "https://www.mhlw.go.jp/toukei/saikin/hw/byouin/m24/dl/9912kekka.pdf",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2024,
    "to": 2024,
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
    "decimalPlaces": 1,
  },
  "calculation": {
    "isCalculated": false,
    "normalizationOptions": [
      {
        "denominator": { "kind": "population", "per": 100000 },
        "unit": "日/10万人",
        "decimalPlaces": 2,
      },
      {
        "denominator": { "kind": "area", "per": 100 },
        "unit": "日/100km²",
        "decimalPlaces": 2,
      },
    ],
  },
  "isActive": true,
};
