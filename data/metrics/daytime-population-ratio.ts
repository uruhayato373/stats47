import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const daytimePopulationRatio: MetricConfig = {
  "key": "daytime-population-ratio",
  "title": "昼夜間人口比率",
  "subtitle": "国勢調査",
  "unit": "%",
  "category": "population",
  "source": {
    "kind": "estat",
    "statsDataId": "0003454499",
    "cdCat01": "0",
    "cdCat02": "00",
    "displayName": "国勢調査",
    "url": "https://www.stat.go.jp/data/kokusei/",
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
    "colorScheme": "interpolateRdYlBu",
    "colorSchemeType": "diverging",
  },
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 1,
  },
  "calculation": {
    "isCalculated": false,
  },
  "groupKey": "daytime-population",
  "isActive": false,
};
