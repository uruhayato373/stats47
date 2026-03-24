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
import type { ComparisonIndicator } from "@/shared/types/comparison";

export type { ComparisonIndicator } from "@/shared/types/comparison";

interface ComparisonOgpProps {
  areaNameA: string;
  areaNameB: string;
  indicators: ComparisonIndicator[];
  theme?: ThemeName;
  showGuides?: boolean;
}

/**
 * 地域比較 OGP 画像 (1200x630)
 *
 * 2県の指標を横並びで比較する VS 対決レイアウト。
 * X 投稿用のコンテンツ画像。
 */
export const ComparisonOgp: React.FC<ComparisonOgpProps> = ({
  areaNameA,
  areaNameB,
  indicators,
  theme = "dark",
  showGuides = false,
}) => {
  const colors = COLOR_SCHEMES[theme];
  const isDark = theme === "dark";

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
        <AbsoluteFill style={{ opacity: 0.06 }}>
          <div
            style={{
              position: "absolute",
              top: -100,
              left: -50,
              width: 400,
              height: 400,
              borderRadius: "50%",
              border: `2px solid ${BRAND.primary}`,
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: -100,
              right: -50,
              width: 400,
              height: 400,
              borderRadius: "50%",
              border: `2px solid ${BRAND.secondary}`,
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

        {/* 中央の区切り線 */}
        <div
          style={{
            position: "absolute",
            top: 100,
            bottom: 20,
            left: "50%",
            width: 2,
            backgroundColor: isDark
              ? "rgba(255,255,255,0.1)"
              : "rgba(0,0,0,0.08)",
          }}
        />

        {/* メインコンテンツ */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            padding: `${SPACING.md}px ${SPACING.xl}px`,
          }}
        >
          {/* ヘッダー: 県名 VS 県名 */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 20,
              marginBottom: SPACING.md,
            }}
          >
            <h2
              style={{
                fontSize: 40,
                fontWeight: FONT.weight.black,
                color: BRAND.primaryLight,
                margin: 0,
                lineHeight: 1,
              }}
            >
              {areaNameA}
            </h2>
            <div
              style={{
                fontSize: 28,
                fontWeight: FONT.weight.black,
                color: BRAND.secondary,
                backgroundColor: isDark
                  ? "rgba(245, 158, 11, 0.15)"
                  : "rgba(245, 158, 11, 0.1)",
                padding: "4px 16px",
                borderRadius: 12,
              }}
            >
              VS
            </div>
            <h2
              style={{
                fontSize: 40,
                fontWeight: FONT.weight.black,
                color: BRAND.danger,
                margin: 0,
                lineHeight: 1,
              }}
            >
              {areaNameB}
            </h2>
          </div>

          {/* 指標一覧 */}
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              gap: SPACING.xs,
            }}
          >
            {indicators.slice(0, 4).map((indicator) => {
              const aWins = indicator.rankA < indicator.rankB;
              const bWins = indicator.rankB < indicator.rankA;

              return (
                <div
                  key={indicator.label}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 0,
                    flex: 1,
                  }}
                >
                  {/* 左: 県Aの値 */}
                  <div
                    style={{
                      flex: 1,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "flex-end",
                      gap: 8,
                      paddingRight: SPACING.md,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 14,
                        fontWeight: FONT.weight.bold,
                        color: colors.muted,
                      }}
                    >
                      {indicator.rankA}位
                    </span>
                    <span
                      style={{
                        fontSize: 28,
                        fontWeight: FONT.weight.black,
                        color: aWins
                          ? BRAND.success
                          : colors.foreground,
                      }}
                    >
                      {indicator.valueA.toLocaleString()}
                    </span>
                  </div>

                  {/* 中央: 指標名 */}
                  <div
                    style={{
                      width: 200,
                      textAlign: "center",
                      backgroundColor: isDark
                        ? "rgba(30, 41, 59, 0.85)"
                        : "rgba(248, 250, 252, 0.9)",
                      padding: `${SPACING.xs}px ${SPACING.sm}px`,
                      borderRadius: 12,
                      border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.06)"}`,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 16,
                        fontWeight: FONT.weight.bold,
                        color: colors.foreground,
                        lineHeight: 1.2,
                      }}
                    >
                      {indicator.label}
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: colors.muted,
                      }}
                    >
                      {indicator.unit}
                    </div>
                  </div>

                  {/* 右: 県Bの値 */}
                  <div
                    style={{
                      flex: 1,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "flex-start",
                      gap: 8,
                      paddingLeft: SPACING.md,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 28,
                        fontWeight: FONT.weight.black,
                        color: bWins
                          ? BRAND.success
                          : colors.foreground,
                      }}
                    >
                      {indicator.valueB.toLocaleString()}
                    </span>
                    <span
                      style={{
                        fontSize: 14,
                        fontWeight: FONT.weight.bold,
                        color: colors.muted,
                      }}
                    >
                      {indicator.rankB}位
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ウォーターマーク */}
        <div
          style={{
            position: "absolute",
            bottom: 20,
            right: 30,
            fontSize: 20,
            fontWeight: FONT.weight.black,
            color: BRAND.primary,
            opacity: 0.6,
          }}
        >
          stats47
        </div>
      </AbsoluteFill>
    </OgpSafeZone>
  );
};
