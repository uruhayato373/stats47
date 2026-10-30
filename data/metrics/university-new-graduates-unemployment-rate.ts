import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const universityNewGraduatesUnemploymentRate: MetricConfig = {
  "key": "university-new-graduates-unemployment-rate",
  "title": "大学新規卒業者の無業者率",
  "unit": "％",
  "category": "educationsports",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010206",
    "cdCat01": "#F03402",
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
    "decimalPlaces": 1,
  },
  "calculation": {
    "isCalculated": false,
  },
  "seoTitle": "大学新規卒業者の無業者率ランキング都道府県【2023年】｜1位沖縄県（20.7％）",
  "seoDescription": "2023年の大学新規卒業者の無業者率の都道府県別ランキング。1位沖縄県（20.7％）、最下位福井県（3.3％）で6.3倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
