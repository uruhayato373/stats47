import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const marriagesPerTotalPopulation: MetricConfig = {
  "key": "marriages-per-total-population",
  "title": "婚姻率",
  "description": "1年間の婚姻件数を総人口で除し、人口千人当たりに換算した率です。",
  "unit": "人口千対",
  "category": "population",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010201",
    "cdCat01": "#A06601",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm"
  },
  "entities": [
    "prefecture"
  ],
  "years": {
    "from": 1975,
    "to": 2022,
  },
  "yearFormat": "calendar",
  "visualization": {
    ...DEFAULT_METRIC_PRESENTATION,
    "colorScheme": "interpolateBlues",
    "colorSchemeType": "sequential",
  },
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 2
  },
  "calculation": {
    "isCalculated": false
  },
  "isActive": true,
  "subtitle": "人口千人当たり"
};
