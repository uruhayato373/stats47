// AUTO-GENERATED — DO NOT EDIT.
// Source of truth: packages/data-configs/src/theme-catalog/education-culture.ts
// Regenerate: npm run generate:catalog --workspace=@stats47/data-configs
import type { IndicatorSet } from "../indicator-set";

export const EDUCATION_CULTURE_SET: IndicatorSet = {
  "key": "education-culture",
  "title": "教育・文化",
  "description": "学校・高等教育への進路・文化施設を分け、地域の学ぶ基盤を比較する。",
  "category": "education",
  "usage": "theme",
  "metrics": [
    {
      "rankingKey": "library-count-per-million",
      "shortLabel": "図書館数（人口100万人当たり）",
      "role": "primary"
    },
    {
      "rankingKey": "elementary-school-count-per-100km2-habitable",
      "shortLabel": "小学校数（可住地100km²当たり）",
      "role": "primary"
    },
    {
      "rankingKey": "junior-high-school-count-per-100km2-habitable",
      "shortLabel": "中学校数（可住地100km²当たり）",
      "role": "secondary"
    },
    {
      "rankingKey": "high-school-count-per-100km2-habitable",
      "shortLabel": "高等学校数（可住地100km²当たり）",
      "role": "secondary"
    },
    {
      "rankingKey": "public-hall-count-per-million",
      "shortLabel": "公民館数（人口100万人当たり）",
      "role": "secondary"
    },
    {
      "rankingKey": "final-education-university-graduate-school-ratio",
      "shortLabel": "大学・大学院卒割合（卒業者総数中）",
      "role": "context"
    },
    {
      "rankingKey": "in-pref-university-entrance-ratio-by-highschool-origin",
      "shortLabel": "県内大学入学割合（同県出身入学者中）",
      "role": "primary"
    },
    {
      "rankingKey": "university-count",
      "shortLabel": "大学数",
      "role": "context"
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
    },
    {
      "rankingKey": "elementary-school-students-per-teacher",
      "shortLabel": "教員1人当たり小学校児童数",
      "role": "secondary"
    },
    {
      "rankingKey": "hobby-participation-rate-theater",
      "shortLabel": "演芸・演劇・舞踊鑑賞の行動者率（10歳以上）",
      "role": "secondary"
    },
    {
      "rankingKey": "university-count-per-100k",
      "shortLabel": "大学数（人口10万人当たり）",
      "role": "secondary"
    },
    {
      "rankingKey": "elementary-school-education-cost-per-student",
      "shortLabel": "小学校教育費",
      "role": "secondary"
    },
    {
      "rankingKey": "study-participation-rate-business",
      "shortLabel": "学習・自己啓発行動者率",
      "role": "secondary"
    },
    {
      "rankingKey": "library-books",
      "shortLabel": "図書館蔵書数",
      "role": "secondary"
    },
    {
      "rankingKey": "library-lending-books",
      "shortLabel": "図書館貸出冊数",
      "role": "secondary"
    },
    {
      "rankingKey": "total-museum-count",
      "shortLabel": "博物館総数",
      "role": "secondary"
    },
    {
      "rankingKey": "art-museum-count",
      "shortLabel": "美術博物館数",
      "role": "secondary"
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
