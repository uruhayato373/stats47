import React from "react";
import { AbsoluteFill } from "remotion";

import { COLOR_SCHEMES, FONT, SPACING, type ThemeName } from "../../themes/brand";

interface LandscapeProps {
  children: React.ReactNode;
  theme?: ThemeName;
}

/**
 * 横型レイアウト（1200x630 OGP / 1280x720 YouTube サムネイル）
 *
 * OGP画像・YouTubeサムネイル等の横型コンテンツ用。
 * テーマに応じた背景色・テキスト色を自動適用する。
 */
export const Landscape: React.FC<LandscapeProps> = ({
  children,
  theme = "light",
}) => {
  const colors = COLOR_SCHEMES[theme];

  return (
    <AbsoluteFill
      style={{
        backgroundColor: colors.background,
        color: colors.foreground,
        fontFamily: FONT.family,
        padding: SPACING.xl,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {children}
    </AbsoluteFill>
  );
};
