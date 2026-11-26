import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const barberShopCount: MetricConfig = {
  "key": "barber-shop-count",
  "title": "理容所数",
  "subtitle": "理容所の施設数",
  "unit": "施設",
  "category": "socialsecurity",
  "source": {
    "kind": "estat",
    "statsDataId": "0004027011",
    "cdTab": "1030",
    "cdCat01": "100",
    "displayName": "衛生行政報告例",
    "url": "https://www.mhlw.go.jp/toukei/saikin/hw/eisei_houkoku/20/",
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
    "colorScheme": "interpolateBlues",
    "colorSchemeType": "sequential",
    domain: { mode: "zero" },
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
        "unit": "施設/10万人",
        "decimalPlaces": 1,
      },
      {
        "denominator": { "kind": "area", "per": 100 },
        "unit": "施設/100km²",
        "decimalPlaces": 2,
      },
    ],
  },
  "isActive": true,
};
