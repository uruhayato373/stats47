import { CTASlide, type ComparisonIndicator, type ThemeName } from "@/shared";
import { previewDataComparison } from "@/utils/preview-data-comparison";
import { ComparisonCoverSlide } from "../ComparisonCoverSlide";
import { ComparisonDetailSlide } from "../ComparisonDetailSlide";
import React from "react";

type SlideType = "cover" | "detail" | "cta";

interface ComparisonCarouselPreviewProps {
  slide?: SlideType;
  theme?: ThemeName;
  areaNameA?: string;
  areaNameB?: string;
  metrics?: ComparisonIndicator[];
}

/**
 * 比較カルーセルのプレビュー用コンポジション
 *
 * Studio の Props パネルから slide を切り替えて確認できる。
 * カルーセル構成: cover → detail → cta
 */
export const ComparisonCarouselPreview: React.FC<
  ComparisonCarouselPreviewProps
> = ({
  slide = "cover",
  theme = "dark",
  areaNameA = previewDataComparison.areaNameA,
  areaNameB = previewDataComparison.areaNameB,
  metrics = previewDataComparison.metrics,
}) => {
  switch (slide) {
    case "cover":
      return (
        <ComparisonCoverSlide
          areaNameA={areaNameA}
          areaNameB={areaNameB}
          indicatorCount={metrics.length}
          theme={theme}
        />
      );
    case "detail":
      return (
        <ComparisonDetailSlide
          areaNameA={areaNameA}
          areaNameB={areaNameB}
          metrics={metrics}
          theme={theme}
        />
      );
    case "cta":
      return <CTASlide theme={theme} />;
    default:
      return (
        <ComparisonCoverSlide
          areaNameA={areaNameA}
          areaNameB={areaNameB}
          indicatorCount={metrics.length}
          theme={theme}
        />
      );
  }
};
