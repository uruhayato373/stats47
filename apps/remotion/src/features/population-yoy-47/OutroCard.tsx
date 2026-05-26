import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import {
  BRAND,
  COLOR_SCHEMES,
  FONT,
  SPACING,
  type ThemeName,
} from "@/shared/themes/brand";

interface OutroCardProps {
  theme?: ThemeName;
  format: "landscape" | "portrait";
  yearStart: number;
  yearEnd: number;
}

export const OutroCard: React.FC<OutroCardProps> = ({
  theme = "dark",
  format,
  yearStart,
  yearEnd,
}) => {
  const colors = COLOR_SCHEMES[theme];
  const frame = useCurrentFrame();
  const isPortrait = format === "portrait";

  const opacity = interpolate(frame, [0, 16], [0, 1], {
    extrapolateRight: "clamp",
  });
  const translate = interpolate(frame, [0, 16], [16, 0], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: colors.background,
        fontFamily: FONT.family,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: SPACING.lg,
        padding: SPACING.xl,
      }}
    >
      <div
        style={{
          opacity,
          transform: `translateY(${translate}px)`,
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: SPACING.sm,
        }}
      >
        <div
          style={{
            fontSize: isPortrait ? 36 : 44,
            fontWeight: FONT.weight.black,
            color: BRAND.primaryLight,
          }}
        >
          stats47.jp
        </div>
        <div
          style={{
            fontSize: isPortrait ? 22 : 26,
            color: colors.foreground,
            fontWeight: FONT.weight.bold,
          }}
        >
          統計で見る都道府県
        </div>
        <div
          style={{
            fontSize: isPortrait ? 16 : 18,
            color: colors.muted,
            marginTop: SPACING.md,
            lineHeight: 1.6,
            maxWidth: isPortrait ? 900 : 1200,
          }}
        >
          出典: 政府統計の総合窓口 e-Stat「都道府県別 推計人口」
          <br />
          各年10月1日基準 / {yearStart - 1}年〜{yearEnd}年
        </div>
      </div>
    </AbsoluteFill>
  );
};
