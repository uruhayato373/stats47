import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const denselyInhabitedDistrictPopulationDensity: MetricConfig = {
  "key": "densely-inhabited-district-population-density",
  "title": "人口集中地区人口密度",
  "unit": "人",
  "category": "population",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010201",
    "cdCat01": "#A01403",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm"
  },
  "entities": [
    "prefecture",
    "city"
  ],
  "years": {
    "years": [
      2000,
      2005,
      2010,
      2015,
      2020
    ]
  },
  "yearFormat": "calendar",
  "visualization": {
    ...DEFAULT_METRIC_PRESENTATION,
    "colorScheme": "interpolateBlues",
    "colorSchemeType": "sequential",
  },
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 1
  },
  "calculation": {
    "isCalculated": false
  },
  "isActive": true,
  "subtitle": "人口集中地区面積1km²当たり",
  "denominator": { "kind": "area", "per": 1, "scope": "人口集中地区" },
};
