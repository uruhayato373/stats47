import React from "react";
import { AbsoluteFill, OffthreadVideo, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { BRAND, COLOR_SCHEMES, FONT, type ThemeName } from "@/shared";
import type { ComparisonIndicator } from "@/shared";
import { getGesVideoPath } from "../ranking-youtube-ges/get-ges-video-path";

interface ComparisonSummaryProps {
  areaNameA: string;
  areaNameB: string;
  areaCodeA: string;
  areaCodeB: string;
  indicators: ComparisonIndicator[];
  theme?: ThemeName;
}

/**
 * 比較ショート動画 サマリースライド (1080x1920, 9:16)
 *
 * 全指標の勝敗をまとめて表示。
 */
export const ComparisonSummary: React.FC<ComparisonSummaryProps> = ({
  areaNameA,
  areaNameB,
  areaCodeA,
  areaCodeB,
  indicators,
  theme = "dark",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const colors = COLOR_SCHEMES[theme];
  const isDark = theme === "dark";

  const videoSrcA = getGesVideoPath(areaCodeA, "portrait");
  const videoSrcB = getGesVideoPath(areaCodeB, "portrait");

  const winsA = indicators.filter((i) => i.rankA < i.rankB).length;
  const winsB = indicators.filter((i) => i.rankB < i.rankA).length;
  const draws = indicators.length - winsA - winsB;

  const headerSpring = spring({ frame, from: 0, to: 1, fps, config: { damping: 12, mass: 0.8 } });
  const scoreSpring = spring({ frame: frame - 20, from: 0, to: 1, fps, config: { damping: 10, mass: 1.2 } });
  const listSpring = spring({ frame: frame - 40, from: 0, to: 1, fps, config: { damping: 12, mass: 0.8 } });

  return (
    <AbsoluteFill style={{ fontFamily: FONT.family, overflow: "hidden" }}>
      {/* 上半分: 地域A GES */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "50%", overflow: "hidden" }}>
        <OffthreadVideo
          src={videoSrcA}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
          muted
        />
        <AbsoluteFill
          style={{
            background: isDark
              ? "linear-gradient(to bottom, rgba(15, 23, 42, 0.5) 0%, rgba(15, 23, 42, 0.8) 100%)"
              : "linear-gradient(to bottom, rgba(255, 255, 255, 0.4) 0%, rgba(255, 255, 255, 0.7) 100%)",
          }}
        />
      </div>

      {/* 下半分: 地域B GES */}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "50%", overflow: "hidden" }}>
        <OffthreadVideo
          src={videoSrcB}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
          muted
        />
        <AbsoluteFill
          style={{
            background: isDark
              ? "linear-gradient(to top, rgba(15, 23, 42, 0.5) 0%, rgba(15, 23, 42, 0.8) 100%)"
              : "linear-gradient(to top, rgba(255, 255, 255, 0.4) 0%, rgba(255, 255, 255, 0.7) 100%)",
          }}
        />
      </div>

      {/* オーバーレイコンテンツ */}
      <div style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "200px 60px 440px",
        gap: 40,
        zIndex: 10,
      }}>
        {/* ヘッダー */}
        <div style={{
          fontSize: 48,
          fontWeight: FONT.weight.black,
          color: colors.foreground,
          textShadow: "0 4px 16px rgba(0,0,0,0.6)",
          opacity: headerSpring,
          transform: `translateY(${interpolate(headerSpring, [0, 1], [-30, 0])}px)`,
          letterSpacing: 4,
        }}>
          結果発表
        </div>

        {/* スコアボード */}
        <div style={{
          width: "100%",
          backgroundColor: isDark ? "rgba(15, 23, 42, 0.9)" : "rgba(255, 255, 255, 0.9)",
          borderRadius: 40,
          padding: "48px 40px",
          backdropFilter: "blur(24px)",
          boxShadow: "0 24px 64px rgba(0,0,0,0.5)",
          border: `2px solid ${colors.border}`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 32,
          transform: `scale(${interpolate(scoreSpring, [0, 1], [0.8, 1])})`,
          opacity: scoreSpring,
        }}>
          {/* スコア表示 */}
          <div style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 24,
          }}>
            {/* A */}
            <div style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 8,
            }}>
              <div style={{
                fontSize: 40,
                fontWeight: FONT.weight.black,
                color: BRAND.primaryLight,
              }}>
                {areaNameA}
              </div>
              <div style={{
                fontSize: 120,
                fontWeight: FONT.weight.black,
                color: winsA >= winsB ? BRAND.primaryLight : colors.muted,
                lineHeight: 1,
              }}>
                {winsA}
              </div>
              <div style={{
                fontSize: 28,
                fontWeight: FONT.weight.bold,
                color: colors.muted,
              }}>
                勝
              </div>
            </div>

            {/* 区切り */}
            <div style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 8,
            }}>
              <div style={{
                fontSize: 40,
                fontWeight: FONT.weight.black,
                color: BRAND.secondary,
              }}>
                VS
              </div>
              {draws > 0 && (
                <div style={{
                  fontSize: 22,
                  fontWeight: FONT.weight.bold,
                  color: colors.muted,
                }}>
                  引分 {draws}
                </div>
              )}
            </div>

            {/* B */}
            <div style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 8,
            }}>
              <div style={{
                fontSize: 40,
                fontWeight: FONT.weight.black,
                color: BRAND.danger,
              }}>
                {areaNameB}
              </div>
              <div style={{
                fontSize: 120,
                fontWeight: FONT.weight.black,
                color: winsB >= winsA ? BRAND.danger : colors.muted,
                lineHeight: 1,
              }}>
                {winsB}
              </div>
              <div style={{
                fontSize: 28,
                fontWeight: FONT.weight.bold,
                color: colors.muted,
              }}>
                勝
              </div>
            </div>
          </div>
        </div>

        {/* 指標別結果リスト */}
        <div style={{
          width: "100%",
          display: "flex",
          flexDirection: "column",
          gap: 8,
          opacity: listSpring,
          transform: `translateY(${interpolate(listSpring, [0, 1], [40, 0])}px)`,
        }}>
          {indicators.map((indicator) => {
            const aWin = indicator.rankA < indicator.rankB;
            const bWin = indicator.rankB < indicator.rankA;
            return (
              <div key={indicator.label} style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                backgroundColor: isDark ? "rgba(15, 23, 42, 0.8)" : "rgba(255, 255, 255, 0.85)",
                backdropFilter: "blur(12px)",
                borderRadius: 16,
                padding: "12px 24px",
                border: `1px solid ${colors.border}`,
              }}>
                <div style={{
                  width: 28,
                  height: 28,
                  borderRadius: 14,
                  backgroundColor: aWin ? BRAND.primaryLight : bWin ? BRAND.danger : colors.muted,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 16,
                  fontWeight: FONT.weight.black,
                  color: "white",
                }}>
                  {aWin ? "A" : bWin ? "B" : "-"}
                </div>
                <div style={{
                  flex: 1,
                  fontSize: 26,
                  fontWeight: FONT.weight.bold,
                  color: colors.foreground,
                }}>
                  {indicator.label}
                </div>
                <div style={{
                  fontSize: 22,
                  fontWeight: FONT.weight.black,
                  color: aWin ? BRAND.primaryLight : bWin ? BRAND.danger : colors.muted,
                }}>
                  {aWin ? areaNameA : bWin ? areaNameB : "引分"}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};
