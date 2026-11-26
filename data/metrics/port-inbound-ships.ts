import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const portInboundShips: MetricConfig = {
  "key": "port-inbound-ships",
  "title": "入港船舶隻数（港湾統計）",
  "subtitle": "港湾統計調査",
  "description": "港湾調査（港湾統計年報）による都道府県別の入港船舶隻数。甲種・乙種港湾の合計。内陸7県（栃木・群馬・埼玉・山梨・長野・岐阜・奈良）はデータなし。",
  "unit": "隻",
  "category": "infrastructure",
  "source": {
    "kind": "estat",
    "statsDataId": "0003130773",
    "cdTab": "110",
    "axisSum": {
          "axis": "cat03",
          "codes": ["110", "120"],
        },
    "cdCat01": "100",
    "cdCat02": "100",
  },
  "entities": [
    "prefecture",
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
    "conversionFactor": 1,
    "decimalPlaces": 1,
  },
  "calculation": {
    "isCalculated": false,
    "normalizationOptions": [
      {
        "denominator": { "kind": "population", "per": 100000 },
        "unit": "隻/10万人",
        "decimalPlaces": 1,
      },
      {
        "denominator": { "kind": "area", "per": 100 },
        "unit": "隻/100km²",
        "decimalPlaces": 2,
      },
    ],
  },
  "additionalCategories": [
    "infrastructure",
  ],
  "isActive": true,
};
