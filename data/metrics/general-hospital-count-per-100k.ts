import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const generalHospitalCountPer100k: MetricConfig = {
  "key": "general-hospital-count-per-100k",
  "title": "一般病院数",
  "subtitle": "人口10万人当たり",
  "denominator": { "kind": "population", "per": 100000 },
  "description": "医療施設調査で一般病院に区分された施設数を、総人口で除して人口10万人当たりに換算した値です。",
  "unit": "施設",
  "category": "socialsecurity",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010209",
    "cdCat01": "#I0910103",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm"
  },
  "entities": [
    "prefecture",
    "city"
  ],
  "years": {
    "from": 1975,
    "to": 2023,
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
  "groupKey": "general-hospital-count",
  "isActive": true
};
