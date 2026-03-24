import { type ThemeName } from "@/shared";
import { previewDataComparison } from "@/utils/preview-data-comparison";
import { ComparisonOgp, type ComparisonIndicator } from "../ComparisonOgp";
import React from "react";

interface ComparisonOgpPreviewProps {
  theme?: ThemeName;
  showGuides?: boolean;
  areaNameA?: string;
  areaNameB?: string;
  indicators?: ComparisonIndicator[];
}

/**
 * ComparisonOgp のプレビューコンポジション
 *
 * Studio ではモックデータを使用。バッチレンダリング時は
 * inputProps で実データを渡す。
 */
export const ComparisonOgpPreview: React.FC<ComparisonOgpPreviewProps> = ({
  theme = "dark",
  showGuides = false,
  areaNameA = previewDataComparison.areaNameA,
  areaNameB = previewDataComparison.areaNameB,
  indicators = previewDataComparison.indicators,
}) => {
  return (
    <ComparisonOgp
      areaNameA={areaNameA}
      areaNameB={areaNameB}
      indicators={indicators}
      theme={theme}
      showGuides={showGuides}
    />
  );
};
