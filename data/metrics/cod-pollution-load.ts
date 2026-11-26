import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const codPollutionLoad: MetricConfig = {
  "key": "cod-pollution-load",
  "title": "COD汚濁負荷量",
  "subtitle": "化学的酸素要求量（COD）の汚濁負荷量",
  "unit": "kg/日",
  "category": "safetyenvironment",
  "source": {
    "kind": "estat",
    "statsDataId": "0003225562",
    "cdCat01": "110",
    "cdCat02": "120",
    "displayName": "水質汚濁物質排出量総合調査",
    "url": "https://www.env.go.jp/water/impure/index.html",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "years": [
      2011,
      2013,
      2015,
      2017,
      2019,
    ],
  },
  "yearFormat": "fiscal",
  "visualization": {
    ...DEFAULT_METRIC_PRESENTATION,
    "colorScheme": "interpolateReds",
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
        "unit": "kg/日/10万人",
        "decimalPlaces": 2,
      },
      {
        "denominator": { "kind": "area", "per": 100 },
        "unit": "kg/日/100km²",
        "decimalPlaces": 2,
      },
    ],
  },
  "isActive": true,
};
