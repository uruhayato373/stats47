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
import type { ComparisonIndicator } from "@/shared";

interface ComparisonDetailSlideProps {
  areaNameA: string;
  areaNameB: string;
  /** このスライドで表示する指標（最大5件） */
  indicators: ComparisonIndicator[];
  /** スライド番号（2枚目以降） */
  slideIndex?: number;
  theme?: ThemeName;
}

/**
 * 比較カルーセル 詳細スライド (1080x1350, 4:5)
 *
 * 指標ごとに A vs B の値をバー表示で比較。
 */
export const ComparisonDetailSlide: React.FC<ComparisonDetailSlideProps> = ({
  areaNameA,
  areaNameB,
  indicators,
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
      {/* ヘッダー: 県名 VS 県名 */}
      <div
        style={{
          borderTop: `4px solid ${BRAND.primary}`,
          backgroundColor: colors.card,
          padding: `14px ${SPACING.lg}px 16px`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 16,
        }}
      >
        <div
          style={{
            fontSize: 36,
            fontWeight: FONT.weight.black,
            color: BRAND.primaryLight,
          }}
        >
          {areaNameA}
        </div>
        <div
          style={{
            fontSize: 24,
            fontWeight: FONT.weight.black,
            color: BRAND.secondary,
            backgroundColor: isDark
              ? "rgba(245, 158, 11, 0.15)"
              : "rgba(245, 158, 11, 0.1)",
            padding: "2px 12px",
            borderRadius: RADIUS.md,
          }}
        >
          VS
        </div>
        <div
          style={{
            fontSize: 36,
            fontWeight: FONT.weight.black,
            color: BRAND.danger,
          }}
        >
          {areaNameB}
        </div>
      </div>

      {/* 指標一覧 */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          padding: `${SPACING.md}px ${SPACING.lg}px`,
          gap: SPACING.sm,
        }}
      >
        {indicators.slice(0, 5).map((indicator) => {
          const aWins = indicator.rankA < indicator.rankB;
          const bWins = indicator.rankB < indicator.rankA;

          // バーの比率を計算
          const maxVal = Math.max(indicator.valueA, indicator.valueB) || 1;
          const ratioA = indicator.valueA / maxVal;
          const ratioB = indicator.valueB / maxVal;

          return (
            <div
              key={indicator.label}
              style={{
                flex: 1,
                backgroundColor: colors.card,
                borderRadius: RADIUS.md,
                padding: `${SPACING.sm}px ${SPACING.md}px`,
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                gap: 8,
              }}
            >
              {/* 指標名 + 単位 */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                }}
              >
                <span
                  style={{
                    fontSize: 24,
                    fontWeight: FONT.weight.black,
                    color: colors.foreground,
                  }}
                >
                  {indicator.label}
                </span>
                {indicator.unit && (
                  <span
                    style={{
                      fontSize: 18,
                      fontWeight: FONT.weight.medium,
                      color: colors.muted,
                    }}
                  >
                    ({indicator.unit})
                  </span>
                )}
              </div>

              {/* バー + 値 */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                }}
              >
                {/* A */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <div
                    style={{
                      width: 40,
                      fontSize: 16,
                      fontWeight: FONT.weight.bold,
                      color: colors.muted,
                      textAlign: "right",
                    }}
                  >
                    {indicator.rankA}位
                  </div>
                  <div
                    style={{
                      flex: 1,
                      height: 28,
                      backgroundColor: isDark
                        ? "rgba(255,255,255,0.05)"
                        : "rgba(0,0,0,0.04)",
                      borderRadius: RADIUS.sm,
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        width: `${ratioA * 100}%`,
                        height: "100%",
                        backgroundColor: aWins
                          ? BRAND.primaryLight
                          : isDark
                            ? "rgba(59, 130, 246, 0.3)"
                            : "rgba(59, 130, 246, 0.2)",
                        borderRadius: RADIUS.sm,
                      }}
                    />
                  </div>
                  <div
                    style={{
                      minWidth: 100,
                      fontSize: 22,
                      fontWeight: FONT.weight.black,
                      color: aWins ? BRAND.success : colors.foreground,
                      textAlign: "right",
                    }}
                  >
                    {indicator.valueA.toLocaleString()}
                  </div>
                </div>

                {/* B */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <div
                    style={{
                      width: 40,
                      fontSize: 16,
                      fontWeight: FONT.weight.bold,
                      color: colors.muted,
                      textAlign: "right",
                    }}
                  >
                    {indicator.rankB}位
                  </div>
                  <div
                    style={{
                      flex: 1,
                      height: 28,
                      backgroundColor: isDark
                        ? "rgba(255,255,255,0.05)"
                        : "rgba(0,0,0,0.04)",
                      borderRadius: RADIUS.sm,
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        width: `${ratioB * 100}%`,
                        height: "100%",
                        backgroundColor: bWins
                          ? BRAND.danger
                          : isDark
                            ? "rgba(239, 68, 68, 0.3)"
                            : "rgba(239, 68, 68, 0.2)",
                        borderRadius: RADIUS.sm,
                      }}
                    />
                  </div>
                  <div
                    style={{
                      minWidth: 100,
                      fontSize: 22,
                      fontWeight: FONT.weight.black,
                      color: bWins ? BRAND.success : colors.foreground,
                      textAlign: "right",
                    }}
                  >
                    {indicator.valueB.toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
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
