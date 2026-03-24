import { CTASlide, type AreaProfileIndicator, type ThemeName } from "@/shared";
import { previewDataAreaProfile } from "@/utils/preview-data-area-profile";
import { AreaProfileCoverSlide } from "../AreaProfileCoverSlide";
import { AreaProfileDetailSlide } from "../AreaProfileDetailSlide";
import React from "react";

type SlideType = "cover" | "strengths" | "weaknesses" | "cta";

interface AreaProfileCarouselPreviewProps {
  slide?: SlideType;
  theme?: ThemeName;
  areaName?: string;
  strengths?: AreaProfileIndicator[];
  weaknesses?: AreaProfileIndicator[];
}

/**
 * 地域プロファイル カルーセルのプレビュー用コンポジション
 *
 * Studio の Props パネルから slide を切り替えて確認できる。
 * カルーセル構成: cover → strengths → weaknesses → cta
 */
export const AreaProfileCarouselPreview: React.FC<
  AreaProfileCarouselPreviewProps
> = ({
  slide = "cover",
  theme = "dark",
  areaName = previewDataAreaProfile.areaName,
  strengths = previewDataAreaProfile.strengths,
  weaknesses = previewDataAreaProfile.weaknesses,
}) => {
  switch (slide) {
    case "cover":
      return (
        <AreaProfileCoverSlide
          areaName={areaName}
          topStrength={strengths[0]}
          topWeakness={weaknesses[0]}
          theme={theme}
        />
      );
    case "strengths":
      return (
        <AreaProfileDetailSlide
          areaName={areaName}
          type="strengths"
          items={strengths}
          theme={theme}
        />
      );
    case "weaknesses":
      return (
        <AreaProfileDetailSlide
          areaName={areaName}
          type="weaknesses"
          items={weaknesses}
          theme={theme}
        />
      );
    case "cta":
      return <CTASlide theme={theme} />;
    default:
      return (
        <AreaProfileCoverSlide
          areaName={areaName}
          topStrength={strengths[0]}
          topWeakness={weaknesses[0]}
          theme={theme}
        />
      );
  }
};
