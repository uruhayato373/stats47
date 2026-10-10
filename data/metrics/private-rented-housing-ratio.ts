import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const privateRentedHousingRatio: MetricConfig = {
  "key": "private-rented-housing-ratio",
  "title": "民営借家比率",
  "unit": "％",
  "category": "construction",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010208",
    "cdCat01": "#H0130202",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "years": [
      1978,
      1983,
      1988,
      1993,
      1998,
      2003,
      2008,
      2013,
      2018,
      2023,
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
    "decimalPlaces": 1,
  },
  "calculation": {
    "isCalculated": false,
  },
  "seoTitle": "民営借家比率ランキング都道府県【2023年】｜1位沖縄県（44.4％）",
  "seoDescription": "2023年の民営借家比率の都道府県別ランキング。1位沖縄県（44.4％）、最下位秋田県（16.7％）で2.7倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
