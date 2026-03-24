import React from "react";
import { AbsoluteFill } from "remotion";
import {
  BRAND,
  COLOR_SCHEMES,
  FONT,
  RADIUS,
  SPACING,
  type ThemeName,
} from "@/shared/themes/brand";

interface ComparisonCoverSlideProps {
  areaNameA: string;
  areaNameB: string;
  /** 比較する指標数 */
  indicatorCount?: number;
  theme?: ThemeName;
}

/**
 * 比較カルーセル表紙 (1080x1350, 4:5)
 *
 * 2県名を VS レイアウトで大きく表示。
 */
export const ComparisonCoverSlide: React.FC<ComparisonCoverSlideProps> = ({
  areaNameA,
  areaNameB,
  indicatorCount = 0,
  theme = "dark",
}) => {
  const colors = COLOR_SCHEMES[theme];
  const isDark = theme === "dark";

  return (
    <AbsoluteFill
      style={{
        backgroundColor: colors.background,
        color: colors.foreground,
        fontFamily: FONT.family,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* ヘッダー */}
      <div
        style={{
          borderTop: `4px solid ${BRAND.primary}`,
          backgroundColor: colors.card,
          padding: `12px ${SPACING.lg}px 14px`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 6,
        }}
      >
        <div
          style={{
            fontSize: 26,
            fontWeight: FONT.weight.bold,
            color: colors.muted,
            letterSpacing: 2,
          }}
        >
          都道府県比較
        </div>
        {indicatorCount > 0 && (
          <div
            style={{
              fontSize: 22,
              fontWeight: FONT.weight.medium,
              color: colors.muted,
              backgroundColor: isDark
                ? "rgba(255,255,255,0.06)"
                : "rgba(0,0,0,0.05)",
              padding: "3px 16px",
              borderRadius: RADIUS.full,
              letterSpacing: 1,
            }}
          >
            {indicatorCount}項目で徹底比較
          </div>
        )}
      </div>

      {/* VS エリア */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          gap: SPACING.xl,
          padding: SPACING.xl,
        }}
      >
        {/* 県A */}
        <div
          style={{
            backgroundColor: isDark
              ? "rgba(59, 130, 246, 0.08)"
              : "rgba(59, 130, 246, 0.05)",
            border: `2px solid ${BRAND.primaryLight}40`,
            borderRadius: RADIUS.lg,
            padding: `${SPACING.xl}px ${SPACING.xxl}px`,
            width: "100%",
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontSize: 80,
              fontWeight: FONT.weight.black,
              color: BRAND.primaryLight,
              lineHeight: 1.1,
            }}
          >
            {areaNameA}
          </div>
        </div>

        {/* VS バッジ */}
        <div
          style={{
            fontSize: 48,
            fontWeight: FONT.weight.black,
            color: BRAND.secondary,
            backgroundColor: isDark
              ? "rgba(245, 158, 11, 0.15)"
              : "rgba(245, 158, 11, 0.1)",
            padding: "8px 40px",
            borderRadius: RADIUS.lg,
            border: `2px solid ${BRAND.secondary}40`,
          }}
        >
          VS
        </div>

        {/* 県B */}
        <div
          style={{
            backgroundColor: isDark
              ? "rgba(239, 68, 68, 0.08)"
              : "rgba(239, 68, 68, 0.05)",
            border: `2px solid ${BRAND.danger}40`,
            borderRadius: RADIUS.lg,
            padding: `${SPACING.xl}px ${SPACING.xxl}px`,
            width: "100%",
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontSize: 80,
              fontWeight: FONT.weight.black,
              color: BRAND.danger,
              lineHeight: 1.1,
            }}
          >
            {areaNameB}
          </div>
        </div>
      </div>

      {/* フッター */}
      <div
        style={{
          backgroundColor: isDark ? colors.card : "#F1F5F9",
          borderTop: `1px solid ${colors.border}`,
          padding: "10px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 12,
        }}
      >
        <div
          style={{
            fontSize: 22,
            fontWeight: FONT.weight.black,
            color: BRAND.primary,
            letterSpacing: 1,
          }}
        >
          stats47.jp
        </div>
        <div style={{ width: 1, height: 16, backgroundColor: colors.border }} />
        <div
          style={{
            fontSize: 20,
            fontWeight: FONT.weight.medium,
            color: colors.muted,
            letterSpacing: 1,
          }}
        >
          統計で見る都道府県
        </div>
      </div>
    </AbsoluteFill>
  );
};
