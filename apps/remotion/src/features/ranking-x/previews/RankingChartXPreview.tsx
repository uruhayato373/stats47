import { type RankingEntry, type RankingMeta, type ThemeName, resolveRankingData } from "@/shared";
import { RankingChartX } from "../RankingChartX";
import React from "react";

interface RankingChartXPreviewProps {
  theme?: ThemeName;
  meta?: RankingMeta;
  allEntries?: RankingEntry[];
  displayTitle?: string;
}

export const RankingChartXPreview: React.FC<RankingChartXPreviewProps> = ({
  theme = "light",
  meta,
  allEntries,
  displayTitle,
}) => {
  const { meta: resolved, entries, precision } = resolveRankingData({ meta, allEntries });
  const topEntries = entries.slice(0, 5);
  const bottomEntries = [...entries].sort((a, b) => a.rank - b.rank).slice(-5);

  return (
    <RankingChartX
      meta={resolved}
      topEntries={topEntries}
      bottomEntries={bottomEntries}
      precision={precision}
      theme={theme}
      displayTitle={displayTitle}
    />
  );
};
