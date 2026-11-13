import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const compulsoryEducationSchoolCountPer100k614: MetricConfig = {
  "key": "compulsory-education-school-count-per-100k-6-14",
  "title": "義務教育学校数",
  "subtitle": "6～14歳人口10万人当たり",
  "unit": "校",
  "category": "educationsports",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010205",
    "cdCat01": "#E0110107",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2018,
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
  },
  "seoTitle": "義務教育学校数ランキング都道府県【2024年】｜1位鳥取県（13.9校）",
  "seoDescription": "2024年の義務教育学校数の都道府県別ランキング。1位鳥取県（13.9校）、最下位沖縄県（0校）で地図やグラフで47都道府県を比較。",
  "isActive": true,
};
