import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const restaurantsPer: MetricConfig = {
  "key": "restaurants-per",
  "title": "飲食店数",
  "subtitle": "市区町村・人口当たり",
  "unit": "店",
  "category": "population",
  "source": {
    "kind": "estat",
    "statsDataId": "0000020308",
    "cdCat01": "#H06107",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "city",
  ],
  "years": {
    "from": 2006,
    "to": 2006,
  },
  "yearFormat": "fiscal",
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
  },
  "groupKey": "restaurants-per",
  "isActive": false,
};
