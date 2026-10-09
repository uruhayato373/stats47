import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const householdRatioAboveMinimumHousingArea: MetricConfig = {
  "key": "household-ratio-above-minimum-housing-area",
  "title": "最低居住面積水準以上世帯割合",
  "unit": "％",
  "category": "population",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010208",
    "cdCat01": "#H02602",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "years": [
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
  "seoTitle": "最低居住面積水準以上世帯割合ランキング都道府県【2023年】｜1位秋田県（95.2％）",
  "seoDescription": "2023年の最低居住面積水準以上世帯割合の都道府県別ランキング。1位秋田県（95.2％）、最下位東京都（82.2％）で1.2倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
