import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const cityGasSalesVolume: MetricConfig = {
  "key": "city-gas-sales-volume",
  "title": "都市ガス販売量",
  "unit": "万ＭＪ",
  "category": "energy",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010208",
    "cdCat01": "#H051041",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 1999,
    "to": 2016,
  },
  "yearFormat": "fiscal",
  "visualization": {
    ...DEFAULT_METRIC_PRESENTATION,
    "colorScheme": "interpolateOranges",
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
        "unit": "万ＭＪ/10万人",
        "decimalPlaces": 1,
      },
      {
        "denominator": { "kind": "area", "per": 100 },
        "unit": "万ＭＪ/100km²",
        "decimalPlaces": 2,
      },
    ],
  },
  "isActive": true,
};
