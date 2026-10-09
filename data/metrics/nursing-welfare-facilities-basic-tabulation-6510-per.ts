import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const nursingWelfareFacilitiesBasicTabulation6510Per: MetricConfig = {
  "key": "nursing-welfare-facilities-basic-tabulation-6510-per",
  "title": "介護老人福祉施設（基本票）",
  "subtitle": "基本集計",
  "unit": "所",
  "category": "population",
  "source": {
    "kind": "estat",
    "statsDataId": "0000020310",
    "cdCat01": "#J02206",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "city",
  ],
  "years": {
    "from": 2020,
    "to": 2020,
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
  "isActive": false,
};
