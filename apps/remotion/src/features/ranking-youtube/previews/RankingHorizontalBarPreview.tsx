import { type ThemeName, resolveRankingData } from "@/shared";
import { previewData } from "@/utils/preview-data";
import { RankingHorizontalBar } from "../RankingHorizontalBar";
import React from "react";

interface RankingHorizontalBarPreviewProps {
  theme?: ThemeName;
  meta?: any;
  allEntries?: any;
  showSafeAreas?: boolean;
  framesPerPref?: number;
  colorScheme?: string;
  precision?: number;
  musicPath?: string;
  hookText?: string;
  displayTitle?: string;
}

export const RankingHorizontalBarPreview: React.FC<RankingHorizontalBarPreviewProps> = ({
  theme = "dark",
  meta,
  allEntries,
  showSafeAreas = false,
  framesPerPref,
  colorScheme,
  precision,
  musicPath,
  hookText,
  displayTitle,
}) => {
  const { meta: resolved, entries, precision: autoPrecision } = resolveRankingData({ meta, allEntries });

  return (
    <RankingHorizontalBar
      meta={resolved}
      entries={entries}
      theme={theme}
      showSafeAreas={showSafeAreas}
      framesPerPref={framesPerPref}
      colorScheme={colorScheme}
      precision={precision ?? autoPrecision}
      musicPath={musicPath}
      hookText={hookText || previewData.hookText}
      displayTitle={displayTitle || previewData.displayTitle}
    />
  );
};
