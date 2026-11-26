import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import { KAWASAKI_MANUFACTURING_CORRECTIONS } from "./defaults/kawasaki-manufacturing-corrections";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const manufacturingShipment: MetricConfig = {
  "key": "manufacturing-shipment",
  "title": "製造品出荷額等",
  "subtitle": "総額（旧統計）",
  "note": "川崎市・川崎区の1983年と1986年は、統計表の値に誤りがあるため川崎市公表の工業統計の値に置き換えている。",
  "unit": "百万円",
  "category": "miningindustry",
  "source": {
    "kind": "estat",
    "statsDataId": "0000020203",
    "cdCat01": "C3401",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "cityValueCorrections": KAWASAKI_MANUFACTURING_CORRECTIONS,
  "entities": [
    "city",
  ],
  "years": {
    "from": 1980,
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
    "decimalPlaces": 0,
  },
  "calculation": {
    "isCalculated": false,
    "normalizationOptions": [
      {
        "denominator": { "kind": "population", "per": 100000 },
        "unit": "百万円/10万人",
        "decimalPlaces": 1,
      },
      {
        "denominator": { "kind": "area", "per": 100 },
        "unit": "百万円/100km²",
        "decimalPlaces": 2,
      },
    ],
  },
  "groupKey": "manufacturing-shipment",
  "isActive": true,
};
