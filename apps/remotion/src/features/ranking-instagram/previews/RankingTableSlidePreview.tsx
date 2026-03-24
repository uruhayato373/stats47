import { RankingTableSlide, type RankingEntry, type RankingMeta, type ThemeName, resolveRankingData } from "@/shared";
import React from "react";

interface RankingTableSlidePreviewProps {
  theme?: ThemeName;
  meta?: RankingMeta;
  allEntries?: RankingEntry[];
  displayTitle?: string;
}

export const RankingTableSlidePreview: React.FC<RankingTableSlidePreviewProps> = ({
  theme = "light",
  meta,
  allEntries,
  displayTitle,
}) => {
  const { meta: resolved, entries, precision } = resolveRankingData({ meta, allEntries });

  return (
    <RankingTableSlide
      meta={resolved}
      entries={entries}
      precision={precision}
      theme={theme}
      displayTitle={displayTitle}
    />
  );
};
