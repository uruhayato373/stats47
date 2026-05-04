import { type ThemeName } from "@/shared";
import { previewDataComparison } from "@/utils/preview-data-comparison";
import { ComparisonOgp, type ComparisonIndicator } from "../ComparisonOgp";
import React from "react";

interface ComparisonOgpPreviewProps {
  theme?: ThemeName;
  showGuides?: boolean;
  areaNameA?: string;
  areaNameB?: string;
  metrics?: ComparisonIndicator[];
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
  metrics = previewDataComparison.metrics,
}) => {
  return (
    <ComparisonOgp
      areaNameA={areaNameA}
      areaNameB={areaNameB}
      metrics={metrics}
      theme={theme}
      showGuides={showGuides}
    />
  );
};
