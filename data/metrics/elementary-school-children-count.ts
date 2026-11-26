import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const elementarySchoolChildrenCount: MetricConfig = {
  "key": "elementary-school-children-count",
  "title": "小学校児童数",
  "subtitle": "総数",
  "unit": "人",
  "category": "educationsports",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010105",
    "cdCat01": "E2501",
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
        "unit": "人/10万人",
        "decimalPlaces": 1,
      },
      {
        "denominator": { "kind": "area", "per": 100 },
        "unit": "人/100km²",
        "decimalPlaces": 2,
      },
      {
        "type": "series",
        "metric": "elementary-school-children-1-per",
        "label": "人口当たり",
      },
      {
        "type": "series",
        "metric": "elementary-school-students-per-teacher",
        "label": "教員1人当たり",
      },
    ],
    "isCalculated": false,
  },
  "groupKey": "elementary-school-children-count",
  "isActive": true,
};
