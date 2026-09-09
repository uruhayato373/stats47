// AUTO-GENERATED — DO NOT EDIT.
// Source of truth: packages/data-configs/src/theme-catalog/education-culture.ts
// Regenerate: npm run generate:catalog --workspace=@stats47/data-configs
import type { IndicatorSet } from "../indicator-set";

export const EDUCATION_CULTURE_SET: IndicatorSet = {
  "key": "education-culture",
  "title": "教育・文化",
  "description": "都道府県別の小学校数・中学校数・高等学校数・図書館数・公民館数をランキングとチャートで比較。教育・文化施設の地域差を47都道府県のデータで確認できます。",
  "category": "education",
  "usage": "theme",
  "metrics": [
    {
      "rankingKey": "library-count-per-million",
      "shortLabel": "図書館（100万人当たり）",
      "role": "primary"
    },
    {
      "rankingKey": "elementary-school-count-per-100km2-habitable",
      "shortLabel": "小学校（可住地100km²当たり）",
      "role": "primary"
    },
    {
      "rankingKey": "junior-high-school-count-per-100km2-habitable",
      "shortLabel": "中学校（可住地100km²当たり）",
      "role": "secondary"
    },
    {
      "rankingKey": "high-school-count-per-100km2-habitable",
      "shortLabel": "高校（可住地100km²当たり）",
      "role": "secondary"
    },
    {
      "rankingKey": "public-hall-count-per-million",
      "shortLabel": "公民館（100万人当たり）",
      "role": "primary"
    },
    {
      "rankingKey": "final-education-university-graduate-school-ratio",
      "shortLabel": "大学・大学院卒割合",
      "role": "secondary"
    },
    {
      "rankingKey": "in-pref-university-entrance-ratio-by-highschool-origin",
      "shortLabel": "県内大学入学者割合",
      "role": "primary"
    },
    {
      "rankingKey": "university-count",
      "shortLabel": "大学数",
      "role": "secondary"
    },
    {
      "rankingKey": "elementary-school-count",
      "shortLabel": "小学校数",
      "role": "context"
    },
    {
      "rankingKey": "junior-high-school-count",
      "shortLabel": "中学校数",
      "role": "context"
    },
    {
      "rankingKey": "high-school-count",
      "shortLabel": "高等学校数",
      "role": "context"
    },
    {
      "rankingKey": "junior-college-count",
      "shortLabel": "短期大学数",
      "role": "context"
    }
  ],
  "keywords": [
    "学校数",
    "図書館",
    "公民館",
    "教育",
    "文化施設",
    "都道府県",
    "ランキング"
  ]
};
