import { type RankingEntry, type RankingMeta, type ThemeName, resolveRankingData } from "@/shared";
import { RankingBoxplot } from "../RankingBoxplot";
import React from "react";

interface RankingBoxplotPreviewProps {
  theme?: ThemeName;
  meta?: RankingMeta;
  allEntries?: RankingEntry[];
}

export const RankingBoxplotPreview: React.FC<RankingBoxplotPreviewProps> = ({
  theme = "light",
  meta,
  allEntries,
}) => {
  const { meta: resolved, entries, precision } = resolveRankingData({ meta, allEntries });

  return (
    <RankingBoxplot
      meta={resolved}
      entries={entries}
      precision={precision}
      theme={theme}
    />
  );
};
