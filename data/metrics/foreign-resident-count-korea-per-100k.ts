import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const foreignResidentCountKoreaPer100k: MetricConfig = {
  "key": "foreign-resident-count-korea-per-100k",
  "title": "外国人人口",
  "subtitle": "韓国・朝鮮籍・人口10万人当たり",
  "denominator": { "kind": "population", "per": 100000 },
  "description": "国勢調査の韓国・朝鮮籍外国人人口を総人口で除し、人口10万人当たりに換算した人数です。",
  "unit": "人",
  "category": "population",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010201",
    "cdCat01": "#A0160101",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm"
  },
  "entities": [
    "prefecture"
  ],
  "years": {
    "years": [
      1980,
      1985,
      1990,
      1995,
      2000,
      2005,
      2010,
      2015,
      2020
    ]
  },
  "yearFormat": "calendar",
  "visualization": {
    ...DEFAULT_METRIC_PRESENTATION,
    "colorScheme": "interpolateBlues",
    "colorSchemeType": "sequential",
  },
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 1
  },
  "calculation": {
    "isCalculated": false
  },
  "groupKey": "foreign-resident-count-korea",
  "isActive": true
};
