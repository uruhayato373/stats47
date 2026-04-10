import React from "react";

import { type ThemeName, resolveRankingData } from "@/shared";
import { StaticRanking } from "../StaticRanking";

interface StaticRankingPreviewProps {
  theme?: ThemeName;
  meta?: any;
  allEntries?: any;
  showSafeAreas?: boolean;
  displayTitle?: string;
}

export const StaticRankingPreview: React.FC<StaticRankingPreviewProps> = ({
  theme = "dark",
  meta,
  allEntries,
  showSafeAreas = false,
  displayTitle,
}) => {
  const { meta: resolved, entries } = resolveRankingData({ meta, allEntries });

  return (
    <StaticRanking
      meta={resolved}
      entries={entries}
      theme={theme}
      showSafeAreas={showSafeAreas}
      displayTitle={displayTitle}
    />
  );
};
