import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const smartphoneUsageRateBySex: MetricConfig = {
  "key": "smartphone-usage-rate-by-sex",
  "title": "スマートフォン・パソコン使用者の趣味・娯楽行動者率（10歳以上・週全体・総数）",
  "unit": "％",
  "category": "ict",
  "source": {
    "kind": "estat",
    "statsDataId": "0003457311",
    "cdCat03": "0",
    "cdCat04": "00",
    "cdCat05": "15",
    "cdCat01": "1",
    "cdCat02": "0",
    "displayName": "スマートフォン・パソコン使用者の趣味・娯楽行動者率（10歳以上・週全体・総数）",
    "url": "https://www.e-stat.go.jp/dbview?sid=0003457311",
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
