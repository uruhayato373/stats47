import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const departmentSupermarketCountPer100k: MetricConfig = {
  "key": "department-supermarket-count-per-100k",
  "title": "百貨店、総合スーパー数",
  "subtitle": "人口10万人当たり",
  "unit": "店",
  "category": "commercial",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010208",
    "cdCat01": "#H06132",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
    "city",
  ],
  "years": {
    "years": [
      2009,
      2011,
      2014,
      2016,
      2021,
    ],
  },
  "yearFormat": "calendar",
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
  "groupKey": "department-supermarket-count",
  "seoTitle": "百貨店、総合スーパー数ランキング都道府県【2021年】｜1位沖縄県（1.7店）",
  "seoDescription": "2021年の百貨店、総合スーパー数の都道府県別ランキング。1位沖縄県（1.7店）、最下位山形県（0.28店）で6.1倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
