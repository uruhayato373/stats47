import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const cultivatedArea: MetricConfig = {
  "key": "cultivated-area",
  "title": "耕地面積",
  "subtitle": "総面積",
  "unit": "ｈａ",
  "category": "agriculture",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010103",
    "cdCat01": "C3107",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
    "city",
  ],
  "years": {
    "from": 1975,
    "to": 2024,
  },
  "yearFormat": "fiscal",
  "visualization": {
    ...DEFAULT_METRIC_PRESENTATION,
    "colorScheme": "interpolateGreens",
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
        "type": "per_population",
        "label": "人口10万人あたり",
        "unit": "ｈａ/10万人",
        "scaleFactor": 100000,
        "decimalPlaces": 1,
      },
      {
        "type": "per_area",
        "label": "面積100km²あたり",
        "unit": "ｈａ/100km²",
        "scaleFactor": 100,
        "decimalPlaces": 2,
      },
      {
        "type": "series",
        "metric": "cultivated-land-area-per-household",
        "label": "農家1戸当たり",
      },
    ],
  },
  "groupKey": "cultivated-area",
  "isActive": true,
};
