import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const smallScaleFarmHouseholds: MetricConfig = {
  "key": "small-scale-farm-households",
  "title": "経営耕地面積規模別農家数（販売農家）",
  "subtitle": "0.3ha未満",
  "unit": "戸",
  "category": "agriculture",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010103",
    "cdCat01": "C310234",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm"
  },
  "entities": [
    "prefecture",
  ],
  "years": "all",
  "yearFormat": "calendar",
  "visualization": {
    ...DEFAULT_METRIC_PRESENTATION,
    "colorScheme": "interpolateGreens",
    "colorSchemeType": "sequential",
  },
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 0
  },
  "calculation": {
    "isCalculated": false,
    "normalizationOptions": [
      {
        "denominator": { "kind": "population", "per": 100000 },
        "unit": "戸/10万人",
        "decimalPlaces": 1,
      },
      {
        "denominator": { "kind": "area", "per": 100 },
        "unit": "戸/100km²",
        "decimalPlaces": 2,
      }
    ]
  },
  "isActive": true,
};
