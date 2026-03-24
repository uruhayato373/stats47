import type { RankingEntry, RankingMeta } from "../shared/types/ranking";
import type { MigrationDataMap } from "../features/ranking-youtube/RankingMigration";

const meta: RankingMeta = {
  title: "社会増減率",
  unit: "‰",
  yearName: "2019年度",
};

const entries: RankingEntry[] = [
  { rank: 1, areaCode: "13000", areaName: "東京都", value: 8.2 },
  { rank: 2, areaCode: "11000", areaName: "埼玉県", value: 5.2 },
  { rank: 3, areaCode: "14000", areaName: "神奈川県", value: 4.4 },
  { rank: 4, areaCode: "12000", areaName: "千葉県", value: 3.8 },
  { rank: 5, areaCode: "23000", areaName: "愛知県", value: 3.4 },
];

export const migrationPreviewData = {
  meta,
  entries,
  migrationData: {} as MigrationDataMap,
};
