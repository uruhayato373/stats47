import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const malePartTimeHourlyWagePre2019: MetricConfig = {
  "key": "male-part-time-hourly-wage-pre2019",
  "title": "男性パートタイムの給与",
  "subtitle": "〜2018年",
  "unit": "円",
  "category": "laborwage",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010206",
    "cdCat01": "#F06205",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2010,
    "to": 2019,
  },
  "yearFormat": "calendar",
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
    "normalizationOptions": [
      {
        "denominator": { "kind": "population", "per": 100000 },
        "unit": "円/10万人",
        "decimalPlaces": 1,
      },
      {
        "denominator": { "kind": "area", "per": 100 },
        "unit": "円/100km²",
        "decimalPlaces": 2,
      },
    ],
  },
  "isActive": true,
};
