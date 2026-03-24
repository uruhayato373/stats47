import React from "react";
import { AbsoluteFill } from "remotion";

import { BRAND, COLOR_SCHEMES, FONT, SPACING, type ThemeName } from "../../themes/brand";

interface CTASlideProps {
  /** メインの呼びかけテキスト */
  headline?: string;
  /** サブテキスト */
  subtext?: string;
  /** サイトURL表示 */
  siteUrl?: string;
  theme?: ThemeName;
}

/**
 * CTA（Call To Action）スライド (1080x1350, 4:5)
 *
 * カルーセルの最終ページ。フォロー・サイト訪問を促す。
 */
export const CTASlide: React.FC<CTASlideProps> = ({
  headline = "もっと詳しく知りたい方は",
  subtext = "47都道府県の統計データを\nわかりやすく比較・分析",
  siteUrl = "stats47.jp",
  theme = "dark",
}) => {
  const colors = COLOR_SCHEMES[theme];

  return (
    <AbsoluteFill
      style={{
        backgroundColor: colors.background,
        color: colors.foreground,
        fontFamily: FONT.family,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        padding: SPACING.xl,
      }}
    >
      {/* ブランドロゴ */}
      <div
        style={{
          backgroundColor: BRAND.primary,
          color: BRAND.white,
          padding: `${SPACING.sm}px ${SPACING.lg}px`,
          borderRadius: 12,
          fontSize: 32,
          fontWeight: FONT.weight.black,
          marginBottom: SPACING.xxl,
        }}
      >
        stats47
      </div>

      {/* ヘッドライン */}
      <h2
        style={{
          fontSize: 44,
          fontWeight: FONT.weight.black,
          textAlign: "center",
          lineHeight: 1.4,
          marginBottom: SPACING.lg,
        }}
      >
        {headline}
      </h2>

      {/* サブテキスト */}
      <p
        style={{
          fontSize: 28,
          color: colors.muted,
          textAlign: "center",
          lineHeight: 1.6,
          whiteSpace: "pre-line",
          marginBottom: SPACING.xxl,
        }}
      >
        {subtext}
      </p>

      {/* サイトURL */}
      <div
        style={{
          padding: `${SPACING.md}px ${SPACING.xl}px`,
          border: `2px solid ${BRAND.primaryLight}`,
          borderRadius: 16,
          fontSize: 28,
          fontWeight: FONT.weight.bold,
          color: BRAND.primaryLight,
        }}
      >
        {siteUrl}
      </div>
    </AbsoluteFill>
  );
};
