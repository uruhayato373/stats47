import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const highSchoolCount: MetricConfig = {
  "key": "high-school-count",
  "title": "高等学校数",
  "subtitle": "総数",
  "description": "地域内に所在する高等学校の総数。後期中等教育施設の供給規模を示す。",
  "unit": "校",
  "category": "educationsports",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010105",
    "cdCat01": "E4101",
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
        "metric": "high-school-count-per-100k-15-17",
      },
      {
        "type": "series",
        "metric": "high-school-count-per-100km2-habitable",
      },
    ],
    "isCalculated": false,
  },
  "groupKey": "high-school-count",
  "isActive": true,
};
