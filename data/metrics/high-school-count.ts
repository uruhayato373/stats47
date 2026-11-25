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
        "type": "per_population",
        "label": "人口10万人あたり",
        "unit": "校/10万人",
        "scaleFactor": 100000,
        "decimalPlaces": 1,
      },
      {
        "type": "per_area",
        "label": "面積100km²あたり",
        "unit": "校/100km²",
        "scaleFactor": 100,
        "decimalPlaces": 2,
      },
      {
        "type": "series",
        "metric": "high-school-count-per-100k-15-17",
        "label": "15〜17歳人口当たり",
      },
      {
        "type": "series",
        "metric": "high-school-count-per-100km2-habitable",
        "label": "可住地100km²当たり",
      },
    ],
    "isCalculated": false,
  },
  "groupKey": "high-school-count",
  "isActive": true,
};
