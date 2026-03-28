import { type ThemeName, resolveRankingData } from "@/shared";
import { previewData } from "@/utils/preview-data";
import { RankingScrollGes } from "../RankingScrollGes";
import React from "react";

interface RankingScrollGesPreviewProps {
  theme?: ThemeName;
  meta?: any;
  allEntries?: any;
  colorScheme?: string;
  precision?: number;
  musicPath?: string;
  hookText?: string;
  displayTitle?: string;
}

export const RankingScrollGesPreview: React.FC<RankingScrollGesPreviewProps> = ({
  theme = "dark",
  meta,
  allEntries,
  colorScheme,
  precision,
  musicPath,
  hookText,
  displayTitle,
}) => {
  const { meta: resolved, entries, precision: autoPrecision } = resolveRankingData({ meta, allEntries });

  return (
    <RankingScrollGes
      meta={resolved}
      entries={entries}
      theme={theme}
      colorScheme={colorScheme}
      precision={precision ?? autoPrecision}
      musicPath={musicPath}
      hookText={hookText || previewData.hookText}
      displayTitle={displayTitle || previewData.displayTitle}
    />
  );
};
