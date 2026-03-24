import { type ThemeName, resolveRankingData } from "@/shared";
import { previewData } from "@/utils/preview-data";
import { RankingNormal } from "../RankingNormal";
import React from "react";

interface RankingNormalPreviewProps {
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

/**
 * YouTube 通常動画のプレビュー用コンポジション
 */
export const RankingNormalPreview: React.FC<RankingNormalPreviewProps> = ({
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
    <RankingNormal
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
