import type { IndicatorSet } from "../indicator-set";

export const FOREIGN_RESIDENTS_SET: IndicatorSet = {
  key: "foreign-residents",
  title: "外国人",
  description:
    "都道府県別の在留外国人数・外国人比率・国籍別人口を地図とランキングで比較。47都道府県の外国人統計を一覧で確認できます。",
  category: "demographics",
  usage: "theme",
  indicators: [
    // 総数系（比率優先）
    { rankingKey: "foreign-resident-count-per-100k", shortLabel: "外国人比率", role: "primary" },
    { rankingKey: "foreign-resident-count", shortLabel: "外国人数", role: "secondary" },
    { rankingKey: "resident-foreigner-population", shortLabel: "在留外国人", role: "context" },
    // 国籍別（比率優先）
    { rankingKey: "foreign-resident-count-china-per-100k", shortLabel: "中国(比率)", role: "secondary" },
    { rankingKey: "foreign-resident-count-china", shortLabel: "中国(人数)", role: "context" },
    { rankingKey: "foreign-resident-count-korea-per-100k", shortLabel: "韓国(比率)", role: "secondary" },
    { rankingKey: "foreign-resident-count-korea", shortLabel: "韓国(人数)", role: "context" },
    { rankingKey: "foreign-resident-count-usa-per-100k", shortLabel: "米国(比率)", role: "context" },
    { rankingKey: "foreign-resident-count-usa", shortLabel: "米国(人数)", role: "context" },
    // 観光
    { rankingKey: "total-overnight-guests-foreign", shortLabel: "外国人宿泊", role: "secondary" },
  ],
  keywords: [
    "外国人",
    "在留外国人",
    "外国人比率",
    "都道府県",
    "ランキング",
    "統計",
  ],
};
