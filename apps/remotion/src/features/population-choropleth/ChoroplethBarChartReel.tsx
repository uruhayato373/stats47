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
import type { CityPathInfo, PopulationRecord } from "./types";

interface ChoroplethBarChartReelProps {
  tokyoData: PopulationRecord[];
  osakaData: PopulationRecord[];
  tokyoPaths: CityPathInfo[];
  osakaPaths: CityPathInfo[];
  maxAbs: number;
  theme?: ThemeName;
}

const FPS = 30;
const MAP_VIEW_SIZE = 800;
const INTRO_DURATION = 2 * FPS;     // 60f
const CHART_DURATION = 5 * FPS;     // 150f
const OUTRO_DURATION = 3 * FPS;     // 90f
const TOP_N = 10;

interface RankedItem {
  areaName: string;
  ratio: number;
  prefTag: string;
}

function getMergedRanked(
  tokyoData: PopulationRecord[],
  osakaData: PopulationRecord[],
): { increased: RankedItem[]; decreased: RankedItem[] } {
  const all: RankedItem[] = [
    ...tokyoData.map((d) => ({
      areaName: d.areaName,
      ratio: d.ratio,
      prefTag: "東",
    })),
    ...osakaData.map((d) => ({
      areaName: d.areaName,
      ratio: d.ratio,
      prefTag: "大",
    })),
  ];

  const increased = [...all]
    .filter((d) => d.ratio >= 1)
    .sort((a, b) => b.ratio - a.ratio)
    .slice(0, TOP_N);

  const decreased = [...all]
    .sort((a, b) => a.ratio - b.ratio)
    .slice(0, TOP_N);

  return { increased, decreased };
}

const BarChart: React.FC<{
  items: RankedItem[];
  title: string;
  isIncrease: boolean;
  isDark: boolean;
  colors: ColorScheme;
  maxAbs: number;
}> = ({ items, title, isIncrease, isDark, colors, maxAbs }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const barColor = isIncrease ? "#3B82F6" : BRAND.danger;
  const maxBarWidth = 500;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: colors.background,
        fontFamily: FONT.family,
        padding: `${SPACING.xl}px ${SPACING.lg}px`,
      }}
    >
      {/* タイトル */}
      <div
        style={{
          textAlign: "center",
          marginBottom: SPACING.lg,
          paddingTop: 40,
        }}
      >
        <div
          style={{
            fontSize: 22,
            fontWeight: FONT.weight.bold,
            color: colors.muted,
            marginBottom: 8,
          }}
        >
          2025→2045 人口増減率
        </div>
        <div
          style={{
            fontSize: 40,
            fontWeight: FONT.weight.black,
            color: barColor,
          }}
        >
          {title}
        </div>
      </div>

      {/* 棒チャート */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: 12,
          padding: `0 ${SPACING.md}px`,
        }}
      >
        {items.map((item, i) => {
          const changePercent = Math.abs(item.ratio - 1) * 100;
          const barWidth = (changePercent / (maxAbs * 100)) * maxBarWidth;

          const barScale = spring({
            frame: frame - i * 6,
            fps,
            config: { damping: 15, stiffness: 80 },
          });

          const labelOpacity = spring({
            frame: frame - i * 6 - 3,
            fps,
            config: { damping: 20, stiffness: 100 },
          });

          const displayPercent = ((item.ratio - 1) * 100).toFixed(1);

          return (
            <div
              key={`${item.prefTag}-${item.areaName}`}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                height: 48,
              }}
            >
              {/* ラベル */}
              <div
                style={{
                  width: 200,
                  textAlign: "right",
                  opacity: labelOpacity,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "flex-end",
                  gap: 6,
                }}
              >
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: FONT.weight.bold,
                    color: item.prefTag === "東" ? BRAND.primaryLight : BRAND.danger,
                    backgroundColor: isDark
                      ? "rgba(255,255,255,0.08)"
                      : "rgba(0,0,0,0.05)",
                    padding: "2px 6px",
                    borderRadius: 4,
                  }}
                >
                  {item.prefTag}
                </span>
                <span
                  style={{
                    fontSize: 20,
                    fontWeight: FONT.weight.bold,
                    color: colors.foreground,
                  }}
                >
                  {item.areaName}
                </span>
              </div>

              {/* 棒 */}
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <div
                  style={{
                    width: barWidth * barScale,
                    height: 28,
                    backgroundColor: barColor,
                    borderRadius: 4,
                    opacity: 0.85,
                  }}
                />
                <span
                  style={{
                    fontSize: 18,
                    fontWeight: FONT.weight.black,
                    color: barColor,
                    opacity: labelOpacity,
                    whiteSpace: "nowrap",
                  }}
                >
                  {isIncrease ? "+" : ""}
                  {displayPercent}%
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* ウォーターマーク */}
      <div
        style={{
          position: "absolute",
          bottom: 30,
          right: 40,
          fontSize: 18,
          fontWeight: FONT.weight.black,
          color: BRAND.primary,
          opacity: 0.5,
        }}
      >
        stats47
      </div>
    </AbsoluteFill>
  );
};

const IntroWithMiniMap: React.FC<{
  tokyoPaths: CityPathInfo[];
  osakaPaths: CityPathInfo[];
  isDark: boolean;
  colors: ColorScheme;
}> = ({ tokyoPaths, osakaPaths, isDark, colors }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOpacity = spring({
    frame,
    fps,
    config: { damping: 20, stiffness: 80 },
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: colors.background,
        fontFamily: FONT.family,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        opacity: titleOpacity,
      }}
    >
      {/* ミニマップ横並び */}
      <div
        style={{
          display: "flex",
          gap: 20,
          marginBottom: 40,
        }}
      >
        {[
          { paths: tokyoPaths, label: "東京都" },
          { paths: osakaPaths, label: "大阪府" },
        ].map(({ paths, label }) => (
          <div key={label} style={{ textAlign: "center" }}>
            <svg
              viewBox={`0 0 ${MAP_VIEW_SIZE} ${MAP_VIEW_SIZE}`}
              width={280}
              height={280}
            >
              {paths.map((info) => (
                <path
                  key={info.areaCode}
                  d={info.path}
                  fill={info.fill}
                  stroke={isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.15)"}
                  strokeWidth={0.8}
                />
              ))}
            </svg>
            <div
              style={{
                fontSize: 20,
                fontWeight: FONT.weight.bold,
                color: colors.foreground,
                marginTop: 8,
              }}
            >
              {label}
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          fontSize: 42,
          fontWeight: FONT.weight.black,
          color: colors.foreground,
          textAlign: "center",
          lineHeight: 1.3,
        }}
      >
        人口増減率
        <br />
        ランキング
      </div>
    </AbsoluteFill>
  );
};

/**
 * Composition C: 横棒チャートリール (1080x1920, 30fps)
 */
export const ChoroplethBarChartReel: React.FC<ChoroplethBarChartReelProps> = ({
  tokyoData,
  osakaData,
  tokyoPaths,
  osakaPaths,
  maxAbs,
  theme = "dark",
}) => {
  const colors = COLOR_SCHEMES[theme];
  const isDark = theme === "dark";
  const { increased, decreased } = getMergedRanked(tokyoData, osakaData);

  return (
    <AbsoluteFill>
      {/* Intro */}
      <Sequence from={0} durationInFrames={INTRO_DURATION}>
        <IntroWithMiniMap
          tokyoPaths={tokyoPaths}
          osakaPaths={osakaPaths}
          isDark={isDark}
          colors={colors}
        />
      </Sequence>

      {/* 増加 Top10 */}
      <Sequence from={INTRO_DURATION} durationInFrames={CHART_DURATION}>
        <BarChart
          items={increased}
          title="増加 Top10"
          isIncrease={true}
          isDark={isDark}
          colors={colors}
          maxAbs={maxAbs}
        />
      </Sequence>

      {/* 減少 Top10 */}
      <Sequence
        from={INTRO_DURATION + CHART_DURATION}
        durationInFrames={CHART_DURATION}
      >
        <BarChart
          items={decreased}
          title="減少 Top10"
          isIncrease={false}
          isDark={isDark}
          colors={colors}
          maxAbs={maxAbs}
        />
      </Sequence>

      {/* Outro */}
      <Sequence
        from={INTRO_DURATION + CHART_DURATION * 2}
        durationInFrames={OUTRO_DURATION}
      >
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

/** 棒チャートリールの合計フレーム数 */
export const BAR_CHART_REEL_DURATION =
  INTRO_DURATION + CHART_DURATION * 2 + OUTRO_DURATION; // 450f = 15s
