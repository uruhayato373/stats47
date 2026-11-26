import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const totalOvernightGuestsForeign: MetricConfig = {
  "key": "total-overnight-guests-foreign",
  "title": "外国人延べ宿泊者数",
  "description": "外国人延べ宿泊者数（従業者数10人以上の宿泊施設、宿泊旅行統計調査）",
  "note": "社会・人口統計体系は従業者数10人以上の宿泊施設の結果を収める。観光庁が公表する値は従業者数10人未満の施設を含む推計値のため、この値より大きい。",
  "unit": "人泊",
  "category": "tourism",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010107",
    "cdCat01": "G7102",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2009,
    "to": 2024,
  },
  "yearFormat": "calendar",
  "visualization": {
    ...DEFAULT_METRIC_PRESENTATION,
    "colorScheme": "interpolateBlues",
    "colorSchemeType": "sequential",
    domain: { mode: "zero" },
    "isReversed": false,
  },
  "display": {
    "conversionFactor": 0.0001,
    "decimalPlaces": 0,
    "displayUnit": "万人泊",
  },
  "calculation": {
    "isCalculated": false,
    "normalizationOptions": [
      {
        "denominator": { "kind": "population", "per": 100000 },
        "unit": "人泊/10万人",
        "decimalPlaces": 1,
      },
      {
        "denominator": { "kind": "area", "per": 100 },
        "unit": "人泊/100km²",
        "decimalPlaces": 2,
      },
    ],
  },
  "isActive": true,
};
