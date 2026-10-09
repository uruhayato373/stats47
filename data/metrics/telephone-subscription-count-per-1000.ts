import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const telephoneSubscriptionCountPer1000: MetricConfig = {
  "key": "telephone-subscription-count-per-1000",
  "title": "電話加入数",
  "subtitle": "人口1000人当たり",
  "unit": "加入",
  "category": "ict",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010208",
    "cdCat01": "#H06305",
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
  "yearFormat": "fiscal",
  "visualization": {
    ...DEFAULT_METRIC_PRESENTATION,
    "colorScheme": "interpolateBlues",
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
        "type": "per_population",
        "label": "人口10万人あたり",
        "unit": "加入/10万人",
        "scaleFactor": 100000,
        "decimalPlaces": 1,
      },
      {
        "type": "per_area",
        "label": "面積100km²あたり",
        "unit": "加入/100km²",
        "scaleFactor": 100,
        "decimalPlaces": 2,
      },
    ],
  },
  "groupKey": "telephone-subscription-count",
  "seoTitle": "電話加入数ランキング都道府県【2024年】｜1位青森県（143.4加入）",
  "seoDescription": "2024年の電話加入数の都道府県別ランキング。1位青森県（143.4加入）、最下位沖縄県（59.9加入）で2.4倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
