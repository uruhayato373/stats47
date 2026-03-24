import { type RankingEntry, type RankingMeta, type ThemeName, resolveRankingData } from "@/shared";
import { RankingHighlights } from "../RankingHighlights";
import React from "react";

interface RankingHighlightsPreviewProps {
  theme?: ThemeName;
  meta?: RankingMeta;
  allEntries?: RankingEntry[];
}

export const RankingHighlightsPreview: React.FC<RankingHighlightsPreviewProps> = ({
  theme = "light",
  meta,
  allEntries,
}) => {
  const { meta: resolved, entries } = resolveRankingData({ meta, allEntries });
  const topEntries = entries.slice(0, 5);
  const bottomEntries = [...entries].sort((a, b) => a.rank - b.rank).slice(-5);

  return (
    <RankingHighlights
      meta={resolved}
      topEntries={topEntries}
      bottomEntries={bottomEntries}
      theme={theme}
    />
  );
};
