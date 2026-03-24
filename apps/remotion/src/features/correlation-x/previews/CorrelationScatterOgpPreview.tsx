import { type ThemeName } from "@/shared";
import { previewDataCorrelation, type ScatterPoint } from "@/utils/preview-data-correlation";
import {
  CorrelationScatterOgp,
} from "../CorrelationScatterOgp";
import React from "react";

interface CorrelationScatterOgpPreviewProps {
  theme?: ThemeName;
  showGuides?: boolean;
  titleX?: string;
  titleY?: string;
  unitX?: string;
  unitY?: string;
  points?: ScatterPoint[];
  pearsonR?: number;
}

/**
 * CorrelationScatterOgp のプレビューコンポジション
 *
 * Studio ではモックデータを使用。バッチレンダリング時は
 * inputProps で実データを渡す。
 */
export const CorrelationScatterOgpPreview: React.FC<
  CorrelationScatterOgpPreviewProps
> = ({
  theme = "dark",
  showGuides = false,
  titleX = previewDataCorrelation.titleX,
  titleY = previewDataCorrelation.titleY,
  unitX = previewDataCorrelation.unitX,
  unitY = previewDataCorrelation.unitY,
  points = previewDataCorrelation.points,
  pearsonR = previewDataCorrelation.pearsonR,
}) => {
  return (
    <CorrelationScatterOgp
      titleX={titleX}
      titleY={titleY}
      unitX={unitX}
      unitY={unitY}
      points={points}
      pearsonR={pearsonR}
      theme={theme}
      showGuides={showGuides}
    />
  );
};
