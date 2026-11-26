import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const portCargoExport: MetricConfig = {
  "key": "port-cargo-export",
  "title": "輸出貨物量（港湾統計）",
  "description": "港湾を通じて国外へ輸出された貨物量。都道府県の港湾別データを集計した重量で示す。",
  "unit": "トン",
  "category": "infrastructure",
  "source": {
    "kind": "estat",
    "statsDataId": "0003130738",
    "axisSum": {
          "axis": "cat03",
          "codes": ["110", "120", "130"],
        },
    "cdCat01": "110",
    "cdCat02": "100",
  },
  "entities": [
    "prefecture",
    "port",
  ],
  "years": {
    "from": 2005,
    "to": 2023,
  },
  "yearFormat": "fiscal",
  "visualization": {
    ...DEFAULT_METRIC_PRESENTATION,
    "colorScheme": "interpolateBlues",
    "colorSchemeType": "sequential",
    domain: { mode: "zero" },
  },
  "display": {
    "conversionFactor": 0.0001,
    "decimalPlaces": 1,
    "displayUnit": "万トン",
  },
  "calculation": {
    "isCalculated": false,
    "normalizationOptions": [
      {
        "denominator": { "kind": "population", "per": 100000 },
        "unit": "トン/10万人",
        "decimalPlaces": 1,
      },
      {
        "denominator": { "kind": "area", "per": 100 },
        "unit": "トン/100km²",
        "decimalPlaces": 2,
      },
    ],
  },
  "isActive": true,
};
