import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const trafficAccidentCasualtiesPer100Accidents: MetricConfig = {
  "key": "traffic-accident-casualties-per-100-accidents",
  "title": "交通事故死傷者数",
  "subtitle": "事故100件当たり",
  "unit": "人",
  "category": "safetyenvironment",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010211",
    "cdCat01": "#K04201",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 1975,
    "to": 2024,
  },
  "yearFormat": "calendar",
  "visualization": {
    ...DEFAULT_METRIC_PRESENTATION,
    "colorScheme": "interpolateReds",
    "colorSchemeType": "sequential",
  },
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 1,
  },
  "calculation": {
    "isCalculated": false,
    "normalizationOptions": [
      {
        "type": "series",
        "metric": "traffic-accident-casualties-per-population",
        "label": "人口当たり",
      },
    ],
  },
  "groupKey": "traffic-accident-casualties-per-100-accidents",
  "isActive": true,
};
