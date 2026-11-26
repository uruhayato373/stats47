import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const publicAssistanceHousingBeneficiariesPer1000: MetricConfig = {
  "key": "public-assistance-housing-beneficiaries-per-1000",
  "title": "生活保護住宅扶助人員",
  "subtitle": "月平均・人口千人当たり",
  "denominator": { "kind": "population", "per": 1000 },
  "unit": "人",
  "category": "construction",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010210",
    "cdCat01": "#J0110805",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 1975,
    "to": 2023,
  },
  "yearFormat": "fiscal",
  "visualization": {
    ...DEFAULT_METRIC_PRESENTATION,
    "colorScheme": "interpolateBlues",
    "colorSchemeType": "sequential",
  },
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 2,
  },
  "calculation": {
    "isCalculated": false,
  },
  "isActive": true,
};
