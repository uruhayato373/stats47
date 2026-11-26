import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const roadTotalLengthWithExpressway: MetricConfig = {
  "key": "road-total-length-with-expressway",
  "title": "道路実延長（高速道路を含む）",
  "subtitle": "合計（高速道路を含む）",
  "unit": "km",
  "category": "infrastructure",
  "description": "道路法に基づく路線の総延長から、重用延長、未供用延長、渡船延長を除いた実延長について、高速自動車国道、一般国道、都道府県道、市町村道を合計した値。",
  "note": "3月31日現在。自転車専用道と歩道は道路実延長に含まれない。",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010108",
    "cdCat01": "H711001",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
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
    "decimalPlaces": 0,
  },
  "calculation": {
    "isCalculated": false,
    "normalizationOptions": [
      {
        "denominator": { "kind": "population", "per": 100000 },
        "unit": "km/10万人",
        "decimalPlaces": 1,
      },
      {
        "denominator": { "kind": "area", "per": 100 },
        "unit": "km/100km²",
        "decimalPlaces": 2,
      },
    ],
  },
  "isActive": true,
};
