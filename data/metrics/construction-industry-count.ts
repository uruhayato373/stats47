import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const constructionIndustryCount: MetricConfig = {
  "key": "construction-industry-count",
  "title": "建設業者数",
  "unit": "業者",
  "category": "construction",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010103",
    "cdCat01": "C3306",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2000,
    "to": 2023,
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
    "normalizationOptions": [
      {
        "denominator": { "kind": "population", "per": 100000 },
        "unit": "業者/10万人",
        "decimalPlaces": 2,
      },
      {
        "denominator": { "kind": "area", "per": 100 },
        "unit": "業者/100km²",
        "decimalPlaces": 2,
      },
    ],
  },
  "isActive": true,
};
