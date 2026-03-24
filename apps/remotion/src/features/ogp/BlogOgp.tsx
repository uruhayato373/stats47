import React from "react";
import { AbsoluteFill } from "remotion";

import {
  BRAND,
  COLOR_SCHEMES,
  FONT,
  SPACING,
  type ThemeName,
} from "@/shared/themes/brand";
import { OgpSafeZone } from "@/shared/components/layouts/OgpSafeZone";

interface BlogOgpProps {
  title: string;
  subtitle?: string;
  ogpTitle?: string;
  ogpSubtitle?: string;
  theme?: ThemeName;
  showGuides?: boolean;
  hideWatermark?: boolean;
}

/**
 * ブログ OGP 画像 (1200x630)
 *
 * ブログ記事のアイキャッチ / OGP 画像。
 * DashboardOgp と同系統のグラスモーフィズムデザイン。背景地図なし。
 */
export const BlogOgp: React.FC<BlogOgpProps> = ({
  title,
  subtitle,
  ogpTitle,
  ogpSubtitle,
  theme = "light",
  showGuides = false,
  hideWatermark = false,
}) => {
  const displayTitle = ogpTitle || title;
  const displaySubtitle = ogpSubtitle || subtitle;
  const colors = COLOR_SCHEMES[theme];
  const isDark = theme === "dark";
  const titleFontSize = getBlogTitleFontSize(displayTitle);

  return (
    <OgpSafeZone showGuides={showGuides}>
      <AbsoluteFill
        style={{
          backgroundColor: colors.background,
          color: colors.foreground,
          fontFamily: FONT.family,
          overflow: "hidden",
        }}
      >
        {/* 装飾的な背景要素 */}
        <AbsoluteFill style={{ opacity: 0.1 }}>
          <div
            style={{
              position: "absolute",
              top: -100,
              left: -100,
              width: 400,
              height: 400,
              borderRadius: "50%",
              border: `2px solid ${BRAND.primary}`,
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: -150,
              right: -50,
              width: 600,
              height: 600,
              borderRadius: "50%",
              border: `1px solid ${BRAND.secondary}`,
            }}
          />
        </AbsoluteFill>

        {/* ビネット効果 */}
        <AbsoluteFill
          style={{
            background: isDark
              ? "radial-gradient(circle, transparent 20%, rgba(15, 23, 42, 0.6) 100%)"
              : "radial-gradient(circle, transparent 20%, rgba(255, 255, 255, 0.3) 100%)",
          }}
        />

        {/* グラスモーフィズム カード */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            padding: `0 ${SPACING.xl}px`,
          }}
        >
          <div
            style={{
              backgroundColor: isDark
                ? "rgba(15, 23, 42, 0.85)"
                : "rgba(255, 255, 255, 0.8)",
              backdropFilter: "blur(20px)",
              padding: `${SPACING.lg}px ${SPACING.xl * 1.5}px`,
              borderRadius: 24,
              border: `1px solid ${isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.1)"}`,
              boxShadow: isDark
                ? "0 25px 50px -12px rgba(0, 0, 0, 0.5), inset 0 1px 1px rgba(255,255,255,0.1)"
                : "0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.1)",
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              gap: 16,
              maxWidth: 1000,
              width: "100%",
              boxSizing: "border-box",
            }}
          >
            {/* タイトル */}
            <h1
              style={{
                fontSize: titleFontSize,
                fontWeight: FONT.weight.black,
                color: colors.foreground,
                lineHeight: 1.2,
                margin: 0,
                filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.1))",
                wordBreak: "break-word",
                overflow: "hidden",
                display: "-webkit-box",
                WebkitLineClamp: 3,
                WebkitBoxOrient: "vertical",
              }}
            >
              {displayTitle}
            </h1>

            {/* サブタイトル */}
            {displaySubtitle && (
              <div
                style={{
                  fontSize: Math.min(32, Math.round(titleFontSize * 0.6)),
                  fontWeight: FONT.weight.bold,
                  color: colors.muted,
                  lineHeight: 1.4,
                  wordBreak: "break-word",
                  overflow: "hidden",
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                }}
              >
                {displaySubtitle}
              </div>
            )}
          </div>
        </div>

        </AbsoluteFill>

      {/* ウォーターマーク */}
      {!hideWatermark && (
        <div
          style={{
            position: "absolute",
            top: 40,
            left: 40,
            fontSize: 24,
            fontWeight: FONT.weight.black,
            color: BRAND.primary,
            opacity: 0.8,
          }}
        >
          stats47
        </div>
      )}
    </OgpSafeZone>
  );
};

/**
 * タイトルの全角換算文字数に応じたフォントサイズを返す。
 * カードのテキスト領域 ≈ 856px に1行で収まるよう設計。
 * title 上限: 17全角文字相当（スキル規約）
 */
function getBlogTitleFontSize(title: string): number {
  const count = countFullWidthEquivalent(title);
  if (count > 21) return 36;
  if (count > 19) return 40;
  if (count > 17) return 44;
  if (count > 14) return 50;
  return 60;
}

/** 全角文字を1、半角文字を0.5としてカウント */
function countFullWidthEquivalent(text: string): number {
  let count = 0;
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    if (
      (code >= 0x3000 && code <= 0x9fff) ||
      (code >= 0xff00 && code <= 0xffef)
    ) {
      count++;
    } else {
      count += 0.5;
    }
  }
  return count;
}
