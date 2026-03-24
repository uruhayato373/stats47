import { type ThemeName } from "@/shared";
import { previewDataAreaProfile } from "@/utils/preview-data-area-profile";
import { AreaProfileOgp, type AreaProfileIndicator } from "../AreaProfileOgp";
import React from "react";

interface AreaProfileOgpPreviewProps {
  theme?: ThemeName;
  showGuides?: boolean;
  areaName?: string;
  strengths?: AreaProfileIndicator[];
  weaknesses?: AreaProfileIndicator[];
}

/**
 * AreaProfileOgp のプレビューコンポジション
 *
 * Studio ではモックデータを使用。バッチレンダリング時は
 * inputProps で実データを渡す。
 */
export const AreaProfileOgpPreview: React.FC<AreaProfileOgpPreviewProps> = ({
  theme = "dark",
  showGuides = false,
  areaName = previewDataAreaProfile.areaName,
  strengths = previewDataAreaProfile.strengths,
  weaknesses = previewDataAreaProfile.weaknesses,
}) => {
  return (
    <AreaProfileOgp
      areaName={areaName}
      strengths={strengths}
      weaknesses={weaknesses}
      theme={theme}
      showGuides={showGuides}
    />
  );
};
