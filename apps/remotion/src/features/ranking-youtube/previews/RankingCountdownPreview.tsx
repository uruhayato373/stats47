import { type ThemeName, resolveRankingData } from "@/shared";
import { RankingCountdown, getTotalFrames } from "../RankingCountdown";
import React, { useMemo } from "react";
import { useVideoConfig } from "remotion";

interface RankingCountdownPreviewProps {
  theme?: ThemeName;
  meta?: any;
  allEntries?: any;
  showSafeAreas?: boolean;
}

/**
 * YouTube カウントダウン動画のプレビュー用コンポジション
 */
export const RankingCountdownPreview: React.FC<RankingCountdownPreviewProps> = ({
  theme = "dark",
  meta,
  allEntries,
  showSafeAreas = false,
}) => {
  const { meta: resolved, entries, precision } = resolveRankingData({ meta, allEntries });

  return (
    <RankingCountdown
      meta={resolved}
      entries={entries}
      theme={theme}
      showSafeAreas={showSafeAreas}
      precision={precision}
    />
  );
};
