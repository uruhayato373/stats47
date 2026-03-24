import React from "react";
import { AbsoluteFill } from "remotion";

import { BRAND, COLOR_SCHEMES, FONT, SPACING, type ThemeName } from "@/shared/themes/brand";

interface ThumbHeroNumProps {
  /** メインの数値（大きく表示） */
  heroValue: string;
  /** 単位 */
  unit?: string;
  /** タイトル */
  title: string;
  /** サブテキスト */
  subtitle?: string;
  /** 1位の地域名 */
  topArea?: string;
  theme?: ThemeName;
}

/**
 * 衝撃数字型 YouTube サムネイル (1280x720, 16:9)
 *
 * 大きな数字でインパクトを与えるタイプのサムネイル。
 */
export const ThumbHeroNum: React.FC<ThumbHeroNumProps> = ({
  heroValue,
  unit,
  title,
  subtitle,
  topArea,
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
        alignItems: "center",
        padding: SPACING.xl,
      }}
    >
      {/* 左: テキスト */}
      <div style={{ flex: 1, paddingRight: SPACING.lg }}>
        <div
          style={{
            backgroundColor: BRAND.primary,
            color: BRAND.white,
            display: "inline-block",
            padding: `${SPACING.xs / 2}px ${SPACING.sm}px`,
            borderRadius: 6,
            fontSize: 16,
            fontWeight: FONT.weight.bold,
            marginBottom: SPACING.md,
          }}
        >
          都道府県ランキング
        </div>
        <h1
          style={{
            fontSize: 38,
            fontWeight: FONT.weight.black,
            lineHeight: 1.3,
          }}
        >
          {title}
        </h1>
        {subtitle && (
          <p
            style={{
              fontSize: 18,
              color: colors.muted,
              marginTop: SPACING.xs,
            }}
          >
            {subtitle}
          </p>
        )}
      </div>

      {/* 右: 数値 */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {topArea && (
          <div
            style={{
              fontSize: 24,
              fontWeight: FONT.weight.bold,
              color: BRAND.secondary,
              marginBottom: SPACING.xs,
            }}
          >
            {topArea}
          </div>
        )}
        <div
          style={{
            fontSize: 96,
            fontWeight: FONT.weight.black,
            lineHeight: 1,
            color: BRAND.secondary,
          }}
        >
          {heroValue}
        </div>
        {unit && (
          <div
            style={{
              fontSize: 24,
              color: colors.muted,
              fontWeight: FONT.weight.medium,
              marginTop: SPACING.xs,
            }}
          >
            {unit}
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};
