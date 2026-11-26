import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const retailStoreCount: MetricConfig = {
  "key": "retail-store-count",
  "title": "小売店数",
  "subtitle": "総数",
  "unit": "店",
  "category": "commercial",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010108",
    "cdCat01": "H6130",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
    "city",
  ],
  "years": {
    "years": [
      2021,
      2009,
      2011,
      2014,
      2016,
      2021,
    ],
  },
  "yearFormat": "calendar",
  "visualization": {
    ...DEFAULT_METRIC_PRESENTATION,
    "colorScheme": "interpolateBlues",
    "colorSchemeType": "sequential",
  },
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 2,
  },
  "calculation": {
    "isCalculated": false,
    "normalizationOptions": [
      {
        "denominator": { "kind": "population", "per": 100000 },
        "unit": "店/10万人",
        "decimalPlaces": 1,
      },
      {
        "denominator": { "kind": "area", "per": 100 },
        "unit": "店/100km²",
        "decimalPlaces": 2,
      },
      {
        "type": "series",
        "metric": "retail-store-count-per-1000",
        "label": "1000人当たり（旧統計）",
      },
    ],
  },
  "groupKey": "retail-store-count",
  "isActive": true,
};
