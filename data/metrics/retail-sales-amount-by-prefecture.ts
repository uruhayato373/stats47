import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const retailSalesAmountByPrefecture: MetricConfig = {
  "key": "retail-sales-amount-by-prefecture",
  "title": "小売業年間商品販売額（経済センサス活動調査）",
  "unit": "百万円",
  "category": "commercial",
  "source": {
    "kind": "estat",
    "statsDataId": "0004003259",
    "cdCat01": "I2",
    "cdCat02": "0",
    "cdCat03": "0",
    "cdTab": "703-2021",
    "displayName": "小売業年間商品販売額（経済センサス活動調査2021）",
    "url": "https://www.e-stat.go.jp/dbview?sid=0004003259",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2021,
    "to": 2021,
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
    "decimalPlaces": 1,
  },
  "isActive": true,
};
