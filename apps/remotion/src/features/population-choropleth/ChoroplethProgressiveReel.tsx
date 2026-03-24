import React from "react";
import {
  AbsoluteFill,
  Sequence,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import {
  BRAND,
  COLOR_SCHEMES,
  FONT,
  SPACING,
  type ColorScheme,
  type ThemeName,
} from "@/shared/themes/brand";
import { DivergingColorLegend } from "./DivergingColorLegend";
import type { CityPathInfo } from "./types";

interface ChoroplethProgressiveReelProps {
  tokyoPaths: CityPathInfo[];
  osakaPaths: CityPathInfo[];
  maxAbs: number;
  theme?: ThemeName;
}

const FPS = 30;
const MAP_VIEW_SIZE = 800;
const INTRO_DURATION = 3 * FPS;       // 90f
const ITEM_DURATION = 1 * FPS;         // 30f per city
const HOLD_DURATION = 2 * FPS;         // 60f
const OUTRO_DURATION = 2 * FPS;        // 60f

function sortByRatio(paths: CityPathInfo[]) {
  return [...paths].sort((a, b) => a.ratio - b.ratio);
}

const ProgressiveMap: React.FC<{
  paths: CityPathInfo[];
  prefName: string;
  isDark: boolean;
  colors: ColorScheme;
  maxAbs: number;
}> = ({ paths, prefName, isDark, colors, maxAbs }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const sorted = sortByRatio(paths);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: colors.background,
        fontFamily: FONT.family,
      }}
    >
      {/* タイトル */}
      <div
        style={{
          position: "absolute",
          top: 60,
          left: 0,
          right: 0,
          textAlign: "center",
          zIndex: 10,
        }}
      >
        <div
          style={{
            fontSize: 24,
            fontWeight: FONT.weight.bold,
            color: colors.muted,
            marginBottom: 8,
          }}
        >
          2025→2045 人口増減率
        </div>
        <div
          style={{
            fontSize: 48,
            fontWeight: FONT.weight.black,
            color: colors.foreground,
          }}
        >
          {prefName}
        </div>
      </div>

      {/* マップ */}
      <div
        style={{
          position: "absolute",
          top: 180,
          left: 40,
          right: 40,
          bottom: 300,
        }}
      >
        <svg
          viewBox={`0 0 ${MAP_VIEW_SIZE} ${MAP_VIEW_SIZE}`}
          width="100%"
          height="100%"
        >
          {sorted.map((info, i) => {
            const delay = i * ITEM_DURATION;
            const opacity = spring({
              frame: frame - delay,
              fps,
              config: { damping: 20, stiffness: 100 },
            });

            return (
              <path
                key={info.areaCode}
                d={info.path}
                fill={info.fill}
                stroke={isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.2)"}
                strokeWidth={0.8}
                strokeLinejoin="round"
                opacity={opacity}
              />
            );
          })}
        </svg>
      </div>

      {/* 情報カード */}
      <div
        style={{
          position: "absolute",
          bottom: 120,
          left: 40,
          right: 40,
          zIndex: 10,
        }}
      >
        {sorted.map((info, i) => {
          const delay = i * ITEM_DURATION;
          const isActive =
            frame >= delay && frame < delay + ITEM_DURATION;
          if (!isActive) return null;

          const cardOpacity = spring({
            frame: frame - delay,
            fps,
            config: { damping: 20, stiffness: 120 },
          });

          const changePercent = ((info.ratio - 1) * 100).toFixed(1);
          const isIncrease = info.ratio >= 1;

          return (
            <div
              key={info.areaCode}
              style={{
                opacity: cardOpacity,
                backgroundColor: isDark
                  ? "rgba(30, 41, 59, 0.9)"
                  : "rgba(248, 250, 252, 0.95)",
                borderRadius: 16,
                padding: `${SPACING.md}px ${SPACING.lg}px`,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.06)"}`,
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 28,
                    fontWeight: FONT.weight.black,
                    color: colors.foreground,
                  }}
                >
                  {info.areaName}
                </div>
                <div
                  style={{
                    fontSize: 16,
                    color: colors.muted,
                    marginTop: 4,
                  }}
                >
                  {i + 1} / {sorted.length}
                </div>
              </div>
              <div
                style={{
                  fontSize: 36,
                  fontWeight: FONT.weight.black,
                  color: isIncrease ? "#3B82F6" : BRAND.danger,
                }}
              >
                {isIncrease ? "+" : ""}
                {changePercent}%
              </div>
            </div>
          );
        })}
      </div>

      {/* レジェンド */}
      <div
        style={{
          position: "absolute",
          bottom: 50,
          left: 80,
          right: 80,
        }}
      >
        <DivergingColorLegend
          width={920}
          height={40}
          maxAbs={maxAbs}
          fontSize={14}
          textColor={colors.muted}
        />
      </div>
    </AbsoluteFill>
  );
};

/**
 * Composition B: Progressive Reveal リール (1080x1920, 30fps)
 */
export const ChoroplethProgressiveReel: React.FC<ChoroplethProgressiveReelProps> = ({
  tokyoPaths,
  osakaPaths,
  maxAbs,
  theme = "dark",
}) => {
  const colors = COLOR_SCHEMES[theme];
  const isDark = theme === "dark";

  const tokyoCount = sortByRatio(tokyoPaths).length;
  const osakaCount = sortByRatio(osakaPaths).length;

  const tokyoRevealDuration = tokyoCount * ITEM_DURATION;
  const osakaRevealDuration = osakaCount * ITEM_DURATION;

  let offset = 0;

  // Intro
  const introFrom = offset;
  offset += INTRO_DURATION;

  // Tokyo reveal
  const tokyoFrom = offset;
  offset += tokyoRevealDuration + HOLD_DURATION;

  // Osaka reveal
  const osakaFrom = offset;
  offset += osakaRevealDuration + HOLD_DURATION;

  // Outro
  const outroFrom = offset;

  return (
    <AbsoluteFill>
      {/* Intro */}
      <Sequence from={introFrom} durationInFrames={INTRO_DURATION}>
        <AbsoluteFill
          style={{
            backgroundColor: colors.background,
            fontFamily: FONT.family,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              fontSize: 24,
              fontWeight: FONT.weight.bold,
              color: colors.muted,
              marginBottom: 16,
            }}
          >
            2025→2045
          </div>
          <div
            style={{
              fontSize: 48,
              fontWeight: FONT.weight.black,
              color: colors.foreground,
              textAlign: "center",
              lineHeight: 1.3,
            }}
          >
            市区町村別
            <br />
            人口増減率
          </div>
          <div
            style={{
              fontSize: 22,
              fontWeight: FONT.weight.bold,
              color: BRAND.primaryLight,
              marginTop: 24,
            }}
          >
            東京都 × 大阪府
          </div>
        </AbsoluteFill>
      </Sequence>

      {/* Tokyo progressive */}
      <Sequence
        from={tokyoFrom}
        durationInFrames={tokyoRevealDuration + HOLD_DURATION}
      >
        <ProgressiveMap
          paths={tokyoPaths}
          prefName="東京都"
          isDark={isDark}
          colors={colors}
          maxAbs={maxAbs}
        />
      </Sequence>

      {/* Osaka progressive */}
      <Sequence
        from={osakaFrom}
        durationInFrames={osakaRevealDuration + HOLD_DURATION}
      >
        <ProgressiveMap
          paths={osakaPaths}
          prefName="大阪府"
          isDark={isDark}
          colors={colors}
          maxAbs={maxAbs}
        />
      </Sequence>

      {/* Outro */}
      <Sequence from={outroFrom} durationInFrames={OUTRO_DURATION}>
        <AbsoluteFill
          style={{
            backgroundColor: colors.background,
            fontFamily: FONT.family,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              fontSize: 36,
              fontWeight: FONT.weight.black,
              color: BRAND.primary,
            }}
          >
            stats47.jp
          </div>
          <div
            style={{
              fontSize: 18,
              color: colors.muted,
              marginTop: 8,
            }}
          >
            統計で見る都道府県
          </div>
        </AbsoluteFill>
      </Sequence>
    </AbsoluteFill>
  );
};

/**
 * Progressive Reel の合計フレーム数を計算
 */
export function getProgressiveReelDuration(
  tokyoCount: number,
  osakaCount: number,
): number {
  return (
    INTRO_DURATION +
    tokyoCount * ITEM_DURATION +
    HOLD_DURATION +
    osakaCount * ITEM_DURATION +
    HOLD_DURATION +
    OUTRO_DURATION
  );
}
