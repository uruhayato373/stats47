import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const specializedSchoolCountPer100k: MetricConfig = {
  "key": "specialized-school-count-per-100k",
  "title": "専修学校数",
  "subtitle": "人口10万人当たり",
  "unit": "校",
  "category": "educationsports",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010205",
    "cdCat01": "#E08101",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 1976,
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
    "decimalPlaces": 2,
  },
  "calculation": {
    "isCalculated": false,
  },
  "groupKey": "specialized-school-count",
  "seoTitle": "専修学校数ランキング都道府県【2024年】｜1位大分県（4.52校）",
  "seoDescription": "2024年の専修学校数の都道府県別ランキング。1位大分県（4.52校）、最下位神奈川県（1.14校）で4.0倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
