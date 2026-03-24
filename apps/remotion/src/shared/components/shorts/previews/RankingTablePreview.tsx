import {
  RankingTable,
  type RankingEntry,
  type RankingMeta,
  type ThemeName,
  resolveRankingData,
} from "@/shared";
import React from "react";
type TableStyleType = "standard" | "neon";

interface RankingTablePreviewProps {
  tableStyle?: TableStyleType;
  theme?: ThemeName;
  meta?: RankingMeta;
  allEntries?: RankingEntry[];
  showSafeAreas?: boolean;
}

/**
 * ランキングテーブルのプレビュー用コンポジション
 */
export const RankingTablePreview: React.FC<RankingTablePreviewProps> = ({
  tableStyle = "neon",
  theme = "dark",
  meta,
  allEntries,
  showSafeAreas = false,
}) => {
  const { meta: resolved, entries } = resolveRankingData({ meta, allEntries });

  return (
    <RankingTable
      meta={resolved}
      entries={entries}
      tableStyle={tableStyle}
      theme={theme}
      showSafeAreas={showSafeAreas}
    />
  );
};
