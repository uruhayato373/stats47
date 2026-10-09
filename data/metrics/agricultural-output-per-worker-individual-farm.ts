import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const agriculturalOutputPerWorkerIndividualFarm: MetricConfig = {
  "key": "agricultural-output-per-worker-individual-farm",
  "title": "就業者1人当たり農業産出額",
  "subtitle": "個人農業経営体",
  "unit": "万円",
  "category": "agriculture",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010203",
    "cdCat01": "#C0410102",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2023,
    "to": 2023,
  },
  "yearFormat": "fiscal",
  "visualization": {
    ...DEFAULT_METRIC_PRESENTATION,
    "colorScheme": "interpolateGreens",
    "colorSchemeType": "sequential",
  },
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 1,
  },
  "calculation": {
    "isCalculated": false,
  },
  "seoTitle": "就業者1人当たり農業産出額（個人経営体）",
  "isActive": false,
};
