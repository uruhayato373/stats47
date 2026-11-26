import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const departmentSupermarketSales: MetricConfig = {
  "key": "department-supermarket-sales",
  "title": "百貨店・スーパー販売額",
  "unit": "百万円",
  "category": "commercial",
  "source": {
    "kind": "estat",
    "statsDataId": "0004032493",
    "cdCat03": "01030300",
    "cdCat01": "0110200",
    "cdCat02": "0302090",
    "displayName": "商業動態統計調査",
    "url": "https://www.meti.go.jp/statistics/tyo/syoudou/",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2025,
    "to": 2025,
  },
  "yearFormat": "fiscal",
  "visualization": {
    ...DEFAULT_METRIC_PRESENTATION,
    "colorScheme": "interpolateGreens",
    "colorSchemeType": "sequential",
    domain: { mode: "zero" },
  },
  "display": {
    "conversionFactor": 0.01,
    "decimalPlaces": 0,
    "displayUnit": "億円",
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
  "groupKey": "department-supermarket-sales",
  "isActive": true,
};
