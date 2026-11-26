import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const dogRegistrationCount: MetricConfig = {
  "key": "dog-registration-count",
  "title": "犬の登録頭数",
  "unit": "頭",
  "category": "socialsecurity",
  "source": {
    "kind": "estat",
    "statsDataId": "0004026908",
    "cdTab": "1580",
    "displayName": "衛生行政報告例",
    "url": "https://www.mhlw.go.jp/toukei/list/36-19.html",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2020,
    "to": 2020,
  },
  "yearFormat": "calendar",
  "visualization": {
    ...DEFAULT_METRIC_PRESENTATION,
    "colorScheme": "interpolateOranges",
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
        "unit": "頭/10万人",
        "decimalPlaces": 1,
      },
      {
        "denominator": { "kind": "area", "per": 100 },
        "unit": "頭/100km²",
        "decimalPlaces": 2,
      },
    ],
  },
  "groupKey": "animal-registration",
  "isActive": true,
};
