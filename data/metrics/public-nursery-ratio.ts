import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const publicNurseryRatio: MetricConfig = {
  "key": "public-nursery-ratio",
  "title": "公営保育所等割合",
  "unit": "％",
  "category": "educationsports",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010205",
    "cdCat01": "#E01305",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 1975,
    "to": 2020,
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
  },
  "seoTitle": "公営保育所等割合ランキング都道府県【2020年】｜1位長野県（63.6％）",
  "seoDescription": "2020年の公営保育所等割合の都道府県別ランキング。1位長野県（63.6％）、最下位青森県（0.4％）で159.0倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
