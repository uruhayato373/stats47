import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const factoryLocationAreaAnnual: MetricConfig = {
  "key": "factory-location-area-annual",
  "title": "工場立地敷地面積（都道府県別・年次）",
  "unit": "千m2",
  "category": "construction",
  "source": {
    "kind": "estat",
    "statsDataId": "0003411431",
    "displayName": "工場立地敷地面積（都道府県別・年次）",
    "url": "https://www.e-stat.go.jp/dbview?sid=0003411431",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "years": [
      1995,
      1997,
      1998,
      2000,
      2003,
      2004,
      2005,
      2015,
      2017,
      2020,
    ],
  },
  "yearFormat": "fiscal",
  "visualization": {
    ...DEFAULT_METRIC_PRESENTATION,
    "colorScheme": "interpolateBlues",
    "colorSchemeType": "sequential",
    domain: { mode: "zero" },
  },
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 1,
  },
  "isActive": true,
};
