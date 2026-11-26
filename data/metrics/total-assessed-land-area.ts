import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const totalAssessedLandArea: MetricConfig = {
  "key": "total-assessed-land-area",
  "title": "評価総地積",
  "subtitle": "課税対象土地",
  "unit": "ｍ2",
  "category": "administrativefinancial",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010102",
    "cdCat01": "B1201",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
    "city",
  ],
  "years": {
    "from": 1975,
    "to": 2023,
  },
  "yearFormat": "fiscal",
  "visualization": {
    ...DEFAULT_METRIC_PRESENTATION,
    "colorScheme": "interpolateBlues",
    "colorSchemeType": "sequential",
    "isReversed": false,
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
        "unit": "ｍ2/10万人",
        "decimalPlaces": 1,
      },
      {
        "denominator": { "kind": "area", "per": 100 },
        "unit": "ｍ2/100km²",
        "decimalPlaces": 2,
      },
    ],
  },
  "isActive": true,
};
