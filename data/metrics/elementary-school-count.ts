import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const elementarySchoolCount: MetricConfig = {
  "key": "elementary-school-count",
  "title": "小学校数",
  "subtitle": "総数",
  "description": "地域内に所在する小学校の総数。学校教育施設の供給規模を示す。",
  "unit": "校",
  "category": "educationsports",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010105",
    "cdCat01": "E2101",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
    "city",
  ],
  visualization: {
    ...DEFAULT_METRIC_PRESENTATION,
    "colorScheme": "interpolateBlues",
    "colorSchemeType": "sequential",
  },
  "years": {
    "from": 1975,
    "to": 2024,
  },
  "yearFormat": "fiscal",
  "calculation": {
    "normalizationOptions": [
      {
        "denominator": { "kind": "population", "per": 100000 },
        "unit": "校/10万人",
        "decimalPlaces": 1,
      },
      {
        "denominator": { "kind": "area", "per": 100 },
        "unit": "校/100km²",
        "decimalPlaces": 2,
      },
      {
        "type": "series",
        "metric": "elementary-school-count-per-100k-6-11",
        "label": "6〜11歳人口当たり",
      },
      {
        "type": "series",
        "metric": "elementary-school-count-per-100km2-habitable",
        "label": "可住地100km²当たり",
      },
    ],
    "isCalculated": false,
  },
  "groupKey": "elementary-school-count",
  "isActive": true,
};
