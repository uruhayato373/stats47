import React from "react";
import { AbsoluteFill, OffthreadVideo, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { BRAND, COLOR_SCHEMES, FONT, type ThemeName } from "@/shared";
import type { ComparisonIndicator } from "@/shared";
import { getGesVideoPath } from "../ranking-youtube-ges/get-ges-video-path";

interface ComparisonSlideProps {
  /** 地域A の名前 */
  areaNameA: string;
  /** 地域B の名前 */
  areaNameB: string;
  /** 地域A のコード (5桁) */
  areaCodeA: string;
  /** 地域B のコード (5桁) */
  areaCodeB: string;
  /** 表示する指標 */
  indicator: ComparisonIndicator;
  /** 指標インデックス (1-based) */
  indicatorIndex: number;
  /** 指標の総数 */
  totalIndicators: number;
  theme?: ThemeName;
}

/**
 * 比較ショート動画 指標スライド (1080x1920, 9:16)
 *
 * 画面を上下に分割し、各地域の GES 背景動画の上にデータを表示。
 */
export const ComparisonSlide: React.FC<ComparisonSlideProps> = ({
  areaNameA,
  areaNameB,
  areaCodeA,
  areaCodeB,
  indicator,
  indicatorIndex,
  totalIndicators,
  theme = "dark",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const colors = COLOR_SCHEMES[theme];
  const isDark = theme === "dark";

  const videoSrcA = getGesVideoPath(areaCodeA, "portrait");
  const videoSrcB = getGesVideoPath(areaCodeB, "portrait");

  const aWins = indicator.rankA < indicator.rankB;
  const bWins = indicator.rankB < indicator.rankA;

  // アニメーション
  const labelSpring = spring({ frame, from: 0, to: 1, fps, config: { damping: 12, mass: 0.8 } });
  const valueSpringA = spring({ frame: frame - 15, from: 0, to: 1, fps, config: { damping: 12, mass: 0.5 } });
  const valueSpringB = spring({ frame: frame - 25, from: 0, to: 1, fps, config: { damping: 12, mass: 0.5 } });
  const resultSpring = spring({ frame: frame - 40, from: 0, to: 1, fps, config: { damping: 10, mass: 1.2 } });

  // 小数点以下の桁数を元の値から自動判定
  const getDecimalPlaces = (v: number) => {
    const s = String(v);
    const dot = s.indexOf(".");
    return dot === -1 ? 0 : s.length - dot - 1;
  };
  const decimalPlaces = Math.max(getDecimalPlaces(indicator.valueA), getDecimalPlaces(indicator.valueB));

  const rawA = interpolate(valueSpringA, [0, 1], [0, indicator.valueA]);
  const rawB = interpolate(valueSpringB, [0, 1], [0, indicator.valueB]);
  const displayValueA = decimalPlaces > 0 ? rawA.toFixed(decimalPlaces) : Math.floor(rawA).toLocaleString();
  const displayValueB = decimalPlaces > 0 ? rawB.toFixed(decimalPlaces) : Math.floor(rawB).toLocaleString();

  const winnerColor = BRAND.secondary;
  const loserOpacity = 0.6;

  // 上下共通のカードスタイル
  const cardStyle = (isWinner: boolean): React.CSSProperties => ({
    backgroundColor: isDark ? "rgba(15, 23, 42, 0.8)" : "rgba(255, 255, 255, 0.85)",
    borderRadius: 32,
    padding: "32px 48px",
    border: `3px solid ${isWinner ? winnerColor : colors.border}`,
    backdropFilter: "blur(20px)",
    boxShadow: isWinner
      ? `0 0 40px ${winnerColor}44, 0 16px 48px rgba(0,0,0,0.4)`
      : "0 16px 48px rgba(0,0,0,0.3)",
    display: "flex" as const,
    flexDirection: "column" as const,
    alignItems: "center" as const,
    gap: 12,
    opacity: isWinner ? 1 : loserOpacity,
  });

  return (
    <AbsoluteFill style={{ fontFamily: FONT.family, overflow: "hidden" }}>
      {/* 上半分: 地域A */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "50%", overflow: "hidden" }}>
        <OffthreadVideo
          src={videoSrcA}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
          muted
        />
        <AbsoluteFill
          style={{
            background: isDark
              ? "linear-gradient(to bottom, rgba(15, 23, 42, 0.3) 0%, rgba(15, 23, 42, 0.5) 100%)"
              : "linear-gradient(to bottom, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0.4) 100%)",
          }}
        />
        <div style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "120px 60px 40px",
          gap: 20,
        }}>
          {/* 地域名 */}
          <div style={{
            fontSize: 56,
            fontWeight: FONT.weight.black,
            color: "#FFFFFF",
            backgroundColor: `${BRAND.primaryLight}CC`,
            padding: "8px 36px",
            borderRadius: 16,
            textShadow: "0 2px 8px rgba(0,0,0,0.4)",
            opacity: labelSpring,
            transform: `translateY(${interpolate(labelSpring, [0, 1], [-30, 0])}px)`,
          }}>
            {areaNameA}
          </div>

          {/* 値カード */}
          <div style={{
            ...cardStyle(aWins),
            transform: `scale(${interpolate(valueSpringA, [0, 1], [0.8, 1])})`,
            opacity: interpolate(valueSpringA, [0, 1], [0, aWins ? 1 : loserOpacity]),
          }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
              <span style={{
                fontSize: 80,
                fontFamily: "'Inter', sans-serif",
                fontWeight: FONT.weight.black,
                color: aWins ? BRAND.secondary : colors.foreground,
              }}>
                {displayValueA}
              </span>
              <span style={{
                fontSize: 32,
                fontWeight: FONT.weight.bold,
                color: colors.muted,
              }}>
                {indicator.unit}
              </span>
            </div>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              opacity: resultSpring,
              transform: `scale(${resultSpring})`,
            }}>
              <span style={{
                fontSize: 28,
                fontWeight: FONT.weight.bold,
                color: colors.muted,
              }}>
                全国{indicator.rankA}位
              </span>
              {aWins && (
                <span style={{
                  fontSize: 24,
                  fontWeight: FONT.weight.black,
                  color: winnerColor,
                  backgroundColor: `${winnerColor}22`,
                  padding: "2px 12px",
                  borderRadius: 8,
                }}>
                  WIN
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 中央: 指標ラベル */}
      <div style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: `translate(-50%, -50%) scale(${labelSpring})`,
        zIndex: 20,
        backgroundColor: isDark ? "rgba(15, 23, 42, 0.95)" : "rgba(255, 255, 255, 0.95)",
        borderRadius: 32,
        padding: "32px 64px",
        border: `4px solid ${BRAND.primary}`,
        boxShadow: `0 0 48px ${BRAND.primary}44, 0 16px 48px rgba(0,0,0,0.5)`,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 12,
      }}>
        <div style={{
          fontSize: 48,
          fontWeight: FONT.weight.black,
          color: colors.foreground,
          letterSpacing: 2,
        }}>
          {indicator.label}
        </div>
        <div style={{
          fontSize: 36,
          fontWeight: FONT.weight.black,
          color: "#FFFFFF",
          letterSpacing: 2,
        }}>
          {indicatorIndex} / {totalIndicators}
        </div>
      </div>

      {/* 下半分: 地域B */}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "50%", overflow: "hidden" }}>
        <OffthreadVideo
          src={videoSrcB}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
          muted
        />
        <AbsoluteFill
          style={{
            background: isDark
              ? "linear-gradient(to top, rgba(15, 23, 42, 0.3) 0%, rgba(15, 23, 42, 0.5) 100%)"
              : "linear-gradient(to top, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0.4) 100%)",
          }}
        />
        <div style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "40px 60px 120px",
          gap: 20,
        }}>
          {/* 値カード */}
          <div style={{
            ...cardStyle(bWins),
            transform: `scale(${interpolate(valueSpringB, [0, 1], [0.8, 1])})`,
            opacity: interpolate(valueSpringB, [0, 1], [0, bWins ? 1 : loserOpacity]),
          }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
              <span style={{
                fontSize: 80,
                fontFamily: "'Inter', sans-serif",
                fontWeight: FONT.weight.black,
                color: bWins ? BRAND.secondary : colors.foreground,
              }}>
                {displayValueB}
              </span>
              <span style={{
                fontSize: 32,
                fontWeight: FONT.weight.bold,
                color: colors.muted,
              }}>
                {indicator.unit}
              </span>
            </div>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              opacity: resultSpring,
              transform: `scale(${resultSpring})`,
            }}>
              <span style={{
                fontSize: 28,
                fontWeight: FONT.weight.bold,
                color: colors.muted,
              }}>
                全国{indicator.rankB}位
              </span>
              {bWins && (
                <span style={{
                  fontSize: 24,
                  fontWeight: FONT.weight.black,
                  color: BRAND.danger,
                  backgroundColor: `${BRAND.danger}22`,
                  padding: "2px 12px",
                  borderRadius: 8,
                }}>
                  WIN
                </span>
              )}
            </div>
          </div>

          {/* 地域名 */}
          <div style={{
            fontSize: 56,
            fontWeight: FONT.weight.black,
            color: "#FFFFFF",
            backgroundColor: `${BRAND.danger}CC`,
            padding: "8px 36px",
            borderRadius: 16,
            textShadow: "0 2px 8px rgba(0,0,0,0.4)",
            opacity: labelSpring,
            transform: `translateY(${interpolate(labelSpring, [0, 1], [30, 0])}px)`,
          }}>
            {areaNameB}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
