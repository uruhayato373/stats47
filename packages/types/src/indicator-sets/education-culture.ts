import type { IndicatorSet } from "../indicator-set";

export const EDUCATION_CULTURE_SET: IndicatorSet = {
  key: "education-culture",
  title: "教育・文化",
  description:
    "都道府県別の小学校数・中学校数・高等学校数・図書館数・公民館数を地図とランキングで比較。教育・文化施設の地域差を47都道府県のデータで確認できます。",
  category: "education",
  usage: "theme",
  indicators: [
    { rankingKey: "library-count-per-million", shortLabel: "図書館", role: "primary" },
    { rankingKey: "elementary-school-count-per-100km2-habitable", shortLabel: "小学校", role: "secondary" },
    { rankingKey: "junior-high-school-count-per-100km2-habitable", shortLabel: "中学校", role: "secondary" },
    { rankingKey: "high-school-count-per-100km2-habitable", shortLabel: "高等学校", role: "secondary" },
    { rankingKey: "public-hall-count-per-million", shortLabel: "公民館", role: "secondary" },
  ],
  keywords: [
    "学校数",
    "図書館",
    "公民館",
    "教育",
    "文化施設",
    "都道府県",
    "ランキング",
  ],
};
