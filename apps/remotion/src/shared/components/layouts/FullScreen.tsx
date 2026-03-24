import React from "react";
import { AbsoluteFill } from "remotion";

import { COLOR_SCHEMES, FONT, SPACING, type ThemeName } from "../../themes/brand";

interface FullScreenProps {
  children: React.ReactNode;
  theme?: ThemeName;
}

/**
 * 縦型フルスクリーンレイアウト（1080x1920）
 *
 * リール・SNSカード・TikTok 等の縦型コンテンツ用。
 * テーマに応じた背景色・テキスト色を自動適用する。
 */
export const FullScreen: React.FC<FullScreenProps> = ({
  children,
  theme = "dark",
}) => {
  const colors = COLOR_SCHEMES[theme];

  return (
    <AbsoluteFill
      style={{
        backgroundColor: colors.background,
        color: colors.foreground,
        fontFamily: FONT.family,
        padding: SPACING.lg,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {children}
    </AbsoluteFill>
  );
};
