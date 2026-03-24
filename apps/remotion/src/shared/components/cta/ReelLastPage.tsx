import React from "react";
import { AbsoluteFill } from "remotion";

import { BRAND, COLOR_SCHEMES, FONT, SPACING, type ThemeName } from "../../themes/brand";

interface ReelLastPageProps {
  /** メインの呼びかけテキスト */
  headline?: string;
  /** サブテキスト */
  subtext?: string;
  /** サイトURL表示 */
  siteUrl?: string;
  theme?: ThemeName;
  /** プラットフォーム別バリアント */
  variant?: "youtube" | "youtube-short" | "youtube-short-full" | "instagram" | "tiktok";
}

/**
 * Reels ラストページ (1080x1920, 9:16)
 *
 * リール・ショート動画の最終画面。SNS セーフエリアを考慮した
 * サイト誘導 CTA。RankingShort のエンディングシーンで使用。
 */
export const ReelLastPage: React.FC<ReelLastPageProps> = ({
  headline,
  subtext,
  siteUrl = "stats47.jp",
  theme = "dark",
  variant = "youtube",
}) => {
  const isInstagram = variant === "instagram";
  const resolvedHeadline = headline ?? (isInstagram
    ? "プロフィールのリンクから"
    : "もっと詳しく知りたい方は");
  const resolvedSubtext = subtext ?? (isInstagram
    ? "あなたの県は何位？\n全ランキングをチェック"
    : "47都道府県の統計データを\nわかりやすく比較・分析");
  const colors = COLOR_SCHEMES[theme];
  const isDark = theme === "dark";

  return (
    <AbsoluteFill
      style={{
        fontFamily: FONT.family,
        color: colors.foreground,
        background: isDark
          ? "radial-gradient(circle at 50% 50%, #1E293B 0%, #000000 100%)"
          : "radial-gradient(circle at 50% 50%, #F8FAFC 0%, #E2E8F0 100%)",
        overflow: "hidden",
      }}
    >
      {/* 装飾円 */}
      <div style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        width: 800,
        height: 800,
        borderRadius: "50%",
        border: `2px dashed ${isDark ? "#CBD5E0" : "#94A3B8"}`,
        opacity: 0.15,
      }} />
      <div style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        width: 1100,
        height: 1100,
        borderRadius: "50%",
        border: `1px solid ${isDark ? "#CBD5E0" : "#94A3B8"}`,
        opacity: 0.08,
      }} />

      {/* コンテンツ — SNS セーフエリア内（上 250px・下 400px）に収める */}
      <div
        style={{
          position: "absolute",
          top: 250,
          bottom: 400,
          left: 0,
          right: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: SPACING.xxl,
          padding: `0 ${SPACING.xl}px`,
        }}
      >
        {/* ブランドバッジ */}
        <div
          style={{
            backgroundColor: BRAND.primary,
            color: BRAND.white,
            padding: `${SPACING.sm}px ${SPACING.lg}px`,
            borderRadius: 12,
            fontSize: 36,
            fontWeight: FONT.weight.black,
          }}
        >
          stats47
        </div>

        {/* ヘッドライン */}
        <div
          style={{
            fontSize: 52,
            fontWeight: FONT.weight.black,
            textAlign: "center",
            lineHeight: 1.4,
            letterSpacing: 2,
          }}
        >
          {resolvedHeadline}
        </div>

        {/* サブテキスト */}
        <div
          style={{
            fontSize: 36,
            fontWeight: FONT.weight.medium,
            color: colors.muted,
            textAlign: "center",
            lineHeight: 1.6,
            whiteSpace: "pre-line",
          }}
        >
          {resolvedSubtext}
        </div>

        {/* サイトURL */}
        <div
          style={{
            padding: `${SPACING.md}px ${SPACING.xl}px`,
            border: `2px solid ${BRAND.primaryLight}`,
            borderRadius: 16,
            fontSize: 44,
            fontWeight: FONT.weight.black,
            color: BRAND.primaryLight,
            letterSpacing: 2,
          }}
        >
          {siteUrl}
        </div>
      </div>
    </AbsoluteFill>
  );
};
