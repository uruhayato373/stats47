import React from "react";
import {
  AbsoluteFill,
  Sequence,
  interpolate,
  useCurrentFrame,
} from "remotion";
import {
  COLOR_SCHEMES,
  FONT,
  SPACING,
  type ColorScheme,
  type ThemeName,
} from "@/shared/themes/brand";
import { DivergingColorLegend } from "../population-choropleth/DivergingColorLegend";
import { IntroCard } from "./IntroCard";
import { OutroCard } from "./OutroCard";
import { usePopulationYoyData, type YearFrame } from "./usePopulationYoyData";

interface SceneProps {
  format: "landscape" | "portrait";
  theme?: ThemeName;
}

const FPS = 30;
const INTRO_FRAMES = 6 * FPS;       // 6s
const PER_YEAR_FRAMES = 36;         // 1.2s × 49 years = 58.8s
const OUTRO_FRAMES = 4 * FPS;       // 4s

/**
 * 配色 domain の上限（|変化率|）。
 * 全期間の生 maxAbs は 2.80% だが大半の年が ±0.5% 以内に収まり中央付近で潰れるため、
 * ±1.0% で clamp して 1% 超は最大彩度に張り付かせる。視覚的コントラスト優先。
 */
const COLOR_CLAMP = 0.01;

const MAP_LANDSCAPE_W = 1280;
const MAP_LANDSCAPE_H = 1000;
const MAP_PORTRAIT_W = 1000;
const MAP_PORTRAIT_H = 1200;

function getMapDims(format: "landscape" | "portrait") {
  return format === "portrait"
    ? { width: MAP_PORTRAIT_W, height: MAP_PORTRAIT_H }
    : { width: MAP_LANDSCAPE_W, height: MAP_LANDSCAPE_H };
}

export function getPopulationYoy47Duration(yearCount = 49) {
  return INTRO_FRAMES + yearCount * PER_YEAR_FRAMES + OUTRO_FRAMES;
}

interface MapStageProps {
  frames: YearFrame[];
  maxAbs: number;
  format: "landscape" | "portrait";
  theme: ThemeName;
  colors: ColorScheme;
}

const MapStage: React.FC<MapStageProps> = ({
  frames,
  maxAbs,
  format,
  theme,
  colors,
}) => {
  const isPortrait = format === "portrait";
  const isDark = theme === "dark";
  const localFrame = useCurrentFrame();
  const mapDims = getMapDims(format);

  // current year index based on local frame within the main sequence
  const rawIndex = localFrame / PER_YEAR_FRAMES;
  const clampedIndex = Math.max(
    0,
    Math.min(frames.length - 1, Math.floor(rawIndex)),
  );
  const currentFrame = frames[clampedIndex];

  // Fade the year label itself when transitioning
  const intoYear = localFrame - clampedIndex * PER_YEAR_FRAMES;
  const yearOpacity = interpolate(intoYear, [0, 8], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const yearY = interpolate(intoYear, [0, 12], [10, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const yearStart = frames[0].year;
  const yearEnd = frames[frames.length - 1].year;
  const progressPct = ((currentFrame.year - yearStart) /
    Math.max(1, yearEnd - yearStart)) * 100;

  const tokyo = currentFrame.paths.find((p) => p.areaCode === "13");

  // Layout helpers
  const yearBlock = (
    <div
      style={{
        textAlign: isPortrait ? "center" : "left",
        opacity: yearOpacity,
        transform: `translateY(${yearY}px)`,
      }}
    >
      <div
        style={{
          fontSize: 20,
          color: colors.muted,
          fontWeight: FONT.weight.bold,
          letterSpacing: 2,
        }}
      >
        前年度比 5年移動平均
      </div>
      <div
        style={{
          fontSize: isPortrait ? 140 : 180,
          color: colors.foreground,
          fontWeight: FONT.weight.black,
          lineHeight: 1,
          marginTop: 4,
          fontFamily: FONT.family,
          letterSpacing: -2,
        }}
      >
        {currentFrame.year}
      </div>
      <div
        style={{
          fontSize: 18,
          color: colors.muted,
          marginTop: 8,
        }}
      >
        {clampedIndex + 1} / {frames.length}年目（{yearStart}〜{yearEnd}）
      </div>
    </div>
  );

  const legendBlock = (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: 14,
          fontWeight: FONT.weight.bold,
          letterSpacing: 1,
        }}
      >
        <span style={{ color: "#EF4444" }}>← 減少</span>
        <span style={{ color: "#3B82F6" }}>増加 →</span>
      </div>
      <DivergingColorLegend
        width={isPortrait ? 900 : 380}
        height={56}
        maxAbs={maxAbs}
        fontSize={16}
        textColor={colors.muted}
      />
    </div>
  );

  const progressBar = (
    <div
      style={{
        width: "100%",
        height: 4,
        backgroundColor: colors.border,
        borderRadius: 2,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          width: `${progressPct}%`,
          height: "100%",
          backgroundColor: colors.accent,
        }}
      />
    </div>
  );

  // The map itself with overlaid prefecture pieces
  // Note: each prefecture path is regenerated per year because the color depends on the year's ratio.
  const mapSvg = (
    <svg
      viewBox={`0 0 ${mapDims.width} ${mapDims.height}`}
      width="100%"
      height="100%"
      preserveAspectRatio="xMidYMid meet"
      style={{ display: "block" }}
    >
      {currentFrame.paths.map((p) => (
        <path
          key={p.areaCode}
          d={p.path}
          fill={p.fill}
          stroke={isDark ? "rgba(255,255,255,0.18)" : "rgba(0,0,0,0.15)"}
          strokeWidth={0.6}
          strokeLinejoin="round"
        />
      ))}
    </svg>
  );

  const tokyoHighlight = tokyo ? (
    <div
      style={{
        fontSize: 16,
        color: colors.muted,
        marginTop: SPACING.sm,
        textAlign: isPortrait ? "center" : "left",
      }}
    >
      東京:{" "}
      <span
        style={{
          color: tokyo.ratio >= 1 ? "#3B82F6" : "#EF4444",
          fontWeight: FONT.weight.black,
          fontSize: 22,
        }}
      >
        {tokyo.ratio >= 1 ? "+" : ""}
        {((tokyo.ratio - 1) * 100).toFixed(2)}%/年
      </span>
    </div>
  ) : null;

  if (isPortrait) {
    return (
      <AbsoluteFill
        style={{
          backgroundColor: colors.background,
          fontFamily: FONT.family,
          padding: `${SPACING.xl}px ${SPACING.lg}px`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: SPACING.md,
        }}
      >
        {yearBlock}
        {tokyoHighlight}
        <div
          style={{
            width: "100%",
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {mapSvg}
        </div>
        <div style={{ width: "90%" }}>{legendBlock}</div>
        <div style={{ width: "90%" }}>{progressBar}</div>
      </AbsoluteFill>
    );
  }

  // Landscape: map dominates ~70% on the left
  return (
    <AbsoluteFill
      style={{
        backgroundColor: colors.background,
        fontFamily: FONT.family,
        padding: SPACING.lg,
        display: "flex",
        flexDirection: "row",
        gap: SPACING.lg,
      }}
    >
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minWidth: 0,
        }}
      >
        <div
          style={{
            width: "100%",
            height: "100%",
            maxWidth: 1280,
            maxHeight: 1020,
          }}
        >
          {mapSvg}
        </div>
      </div>
      <div
        style={{
          width: 440,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          paddingTop: SPACING.lg,
          paddingBottom: SPACING.lg,
        }}
      >
        <div>
          {yearBlock}
          {tokyoHighlight}
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: SPACING.md,
          }}
        >
          {legendBlock}
          {progressBar}
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const PopulationYoy47Scene: React.FC<SceneProps> = ({
  format,
  theme = "dark",
}) => {
  const colors = COLOR_SCHEMES[theme];
  const dims = getMapDims(format);
  const { frames, timeseries, loading } = usePopulationYoyData({
    format,
    mapWidth: dims.width,
    mapHeight: dims.height,
    clampMaxAbs: COLOR_CLAMP,
  });

  if (loading || !timeseries || frames.length === 0) {
    return (
      <AbsoluteFill
        style={{
          backgroundColor: colors.background,
          fontFamily: FONT.family,
          color: colors.muted,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        Loading…
      </AbsoluteFill>
    );
  }

  const yearStart = frames[0].year;
  const yearEnd = frames[frames.length - 1].year;
  const mainDuration = frames.length * PER_YEAR_FRAMES;

  return (
    <AbsoluteFill>
      <Sequence durationInFrames={INTRO_FRAMES}>
        <IntroCard
          theme={theme}
          format={format}
          maxAbsPercent={COLOR_CLAMP * 100}
          yearStart={yearStart}
          yearEnd={yearEnd}
        />
      </Sequence>

      <Sequence from={INTRO_FRAMES} durationInFrames={mainDuration}>
        <MapStage
          frames={frames}
          maxAbs={COLOR_CLAMP}
          format={format}
          theme={theme}
          colors={colors}
        />
      </Sequence>

      <Sequence
        from={INTRO_FRAMES + mainDuration}
        durationInFrames={OUTRO_FRAMES}
      >
        <OutroCard
          theme={theme}
          format={format}
          yearStart={yearStart}
          yearEnd={yearEnd}
        />
      </Sequence>
    </AbsoluteFill>
  );
};

export const PopulationYoy47Landscape: React.FC<{
  theme?: ThemeName;
}> = ({ theme }) => <PopulationYoy47Scene format="landscape" theme={theme} />;

export const PopulationYoy47Portrait: React.FC<{
  theme?: ThemeName;
}> = ({ theme }) => <PopulationYoy47Scene format="portrait" theme={theme} />;
