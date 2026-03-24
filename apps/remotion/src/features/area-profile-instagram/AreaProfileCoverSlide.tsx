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
import type { AreaProfileIndicator } from "@/shared";

interface AreaProfileCoverSlideProps {
  areaName: string;
  /** 強み1位の指標（表紙に表示） */
  topStrength?: AreaProfileIndicator;
  /** 弱み1位の指標（表紙に表示） */
  topWeakness?: AreaProfileIndicator;
  theme?: ThemeName;
}

/**
 * 地域プロファイル カルーセル表紙 (1080x1350, 4:5)
 *
 * 都道府県名をヒーロー表示し、強み・弱みの1位をティザーとして表示。
 */
export const AreaProfileCoverSlide: React.FC<AreaProfileCoverSlideProps> = ({
  areaName,
  topStrength,
  topWeakness,
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
          地域プロファイル
        </div>
        <div
          style={{
            fontSize: 64,
            fontWeight: FONT.weight.black,
            color: colors.foreground,
            letterSpacing: 1,
            textAlign: "center",
            lineHeight: 1.2,
          }}
        >
          {areaName}
        </div>
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
          強み・弱みランキング
        </div>
      </div>

      {/* メインエリア */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          padding: `${SPACING.lg}px ${SPACING.lg}px`,
          gap: SPACING.md,
          justifyContent: "center",
        }}
      >
        {/* 強み プレビュー */}
        {topStrength && (
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: SPACING.lg,
              backgroundColor: isDark
                ? "rgba(16, 185, 129, 0.08)"
                : "rgba(16, 185, 129, 0.05)",
              borderRadius: RADIUS.lg,
              border: `2px solid ${BRAND.success}40`,
              gap: SPACING.sm,
            }}
          >
            <div
              style={{
                fontSize: 32,
                fontWeight: FONT.weight.black,
                color: BRAND.success,
              }}
            >
              強み 1位
            </div>
            <div
              style={{
                fontSize: 48,
                fontWeight: FONT.weight.black,
                color: colors.foreground,
                textAlign: "center",
                lineHeight: 1.2,
              }}
            >
              {topStrength.label}
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                gap: 8,
              }}
            >
              <span
                style={{
                  fontSize: 56,
                  fontWeight: FONT.weight.black,
                  color: BRAND.secondary,
                }}
              >
                {topStrength.value.toLocaleString()}
              </span>
              <span
                style={{
                  fontSize: 28,
                  fontWeight: FONT.weight.bold,
                  color: colors.muted,
                }}
              >
                {topStrength.unit}
              </span>
            </div>
            <div
              style={{
                fontSize: 24,
                fontWeight: FONT.weight.bold,
                color: colors.muted,
              }}
            >
              全国 {topStrength.rank}位
            </div>
          </div>
        )}

        {/* 弱み プレビュー */}
        {topWeakness && (
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: SPACING.lg,
              backgroundColor: isDark
                ? "rgba(239, 68, 68, 0.08)"
                : "rgba(239, 68, 68, 0.05)",
              borderRadius: RADIUS.lg,
              border: `2px solid ${BRAND.danger}40`,
              gap: SPACING.sm,
            }}
          >
            <div
              style={{
                fontSize: 32,
                fontWeight: FONT.weight.black,
                color: BRAND.danger,
              }}
            >
              弱み 1位
            </div>
            <div
              style={{
                fontSize: 48,
                fontWeight: FONT.weight.black,
                color: colors.foreground,
                textAlign: "center",
                lineHeight: 1.2,
              }}
            >
              {topWeakness.label}
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                gap: 8,
              }}
            >
              <span
                style={{
                  fontSize: 56,
                  fontWeight: FONT.weight.black,
                  color: BRAND.secondary,
                }}
              >
                {topWeakness.value.toLocaleString()}
              </span>
              <span
                style={{
                  fontSize: 28,
                  fontWeight: FONT.weight.bold,
                  color: colors.muted,
                }}
              >
                {topWeakness.unit}
              </span>
            </div>
            <div
              style={{
                fontSize: 24,
                fontWeight: FONT.weight.bold,
                color: colors.muted,
              }}
            >
              全国 {topWeakness.rank}位
            </div>
          </div>
        )}
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
