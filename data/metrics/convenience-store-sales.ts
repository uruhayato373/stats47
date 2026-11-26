import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const convenienceStoreSales: MetricConfig = {
  "key": "convenience-store-sales",
  "title": "コンビニエンスストア販売額",
  "subtitle": "年間販売額",
  "unit": "百万円",
  "category": "commercial",
  "source": {
    "kind": "estat",
    "statsDataId": "0004032502",
    "cdCat03": "01030100",
    "cdCat01": "0101300",
    "cdCat02": "01040100",
    "timeScope": "annual",
    "displayName": "商業動態統計調査",
    "url": "https://www.meti.go.jp/statistics/tyo/syoudou/",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2022,
    "to": 2024,
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
  "groupKey": "convenience-store-sales",
  "seoTitle": "コンビニエンスストア販売額（年計）ランキング都道府県",
  "seoDescription": "コンビニエンスストア販売額（年計）の都道府県別ランキング。商業動態統計調査の年計値で、地図やグラフを使って47都道府県を比較できます。",
  "isActive": true,
};
