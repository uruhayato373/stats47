import React from "react";
import { AbsoluteFill, Audio, Sequence, interpolate, staticFile, useCurrentFrame } from "remotion";
import type { BarChartRaceFrame } from "@stats47/visualization";

import { COLOR_SCHEMES, FONT, ReelLastPage, SafetyZoneOverlay, type ThemeName } from "@/shared";
import { SCENE_DURATION } from "@/utils/constants";
import {
  getBarChartRaceTimeline,
  type EventLabel,
} from "../../utils/bar-chart-race";
import {
  MOCK_BAR_CHART_RACE_FRAMES,
  MOCK_EVENT_LABELS,
} from "../../utils/mock-bar-chart-race-data";
import { BarChartRaceScene } from "../charts/BarChartRaceScene";
import { BarChartRaceIntro, type ColorSchemeName } from "./BarChartRaceIntro";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** public/music/ 内の BGM ファイル一覧 */
const BGM_FILES = [
  "music/bgm.mp3",
  "music/Morning.mp3",
  "music/パステルハウス BGM.mp3",
  "music/野良猫は宇宙を目指した.mp3",
];

export interface BarChartRaceShortProps {
  frames?: BarChartRaceFrame[];
  title?: string;
  unit?: string;
  topN?: number;
  framesPerYear?: number;
  theme?: ThemeName;
  variant?: "youtube" | "instagram" | "tiktok";
  showSafeAreas?: boolean;
  hookText?: string;
  eventLabels?: EventLabel[];
  ctaHeadline?: string;
  /** Spoiler Hook を有効にするか（最終年の1位を冒頭に2秒表示） @default false */
  enableSpoilerHook?: boolean;
  /** BGM ファイルパス。省略時は BGM_FILES からランダム選択 */
  musicPath?: string;
  /** イントロのタイルマップカラースキーム @default "Blues" */
  colorScheme?: ColorSchemeName;
  /** 最終年度を固定表示するフレーム数 @default 90 (3秒) */
  endHoldFrames?: number;
}

// Re-export for external use
export { getBarChartRaceTimeline };

// ---------------------------------------------------------------------------
// Spoiler Scene
// ---------------------------------------------------------------------------

interface SpoilerSceneProps {
  frames: BarChartRaceFrame[];
  theme: ThemeName;
}

const SpoilerScene: React.FC<SpoilerSceneProps> = ({ frames, theme }) => {
  const frame = useCurrentFrame();
  const colors = COLOR_SCHEMES[theme];

  // 最終年の1位
  const lastFrame = frames[frames.length - 1];
  if (!lastFrame) return null;

  const sorted = [...lastFrame.items].sort((a, b) => b.value - a.value);
  const winner = sorted[0];
  if (!winner) return null;

  const fadeIn = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });
  const fadeOut = interpolate(frame, [40, 55], [1, 0], { extrapolateRight: "clamp" });
  const opacity = Math.min(fadeIn, fadeOut);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: colors.background,
        fontFamily: FONT.family,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 40,
        opacity,
      }}
    >
      <div
        style={{
          fontSize: 130,
          fontWeight: FONT.weight.black,
          color: colors.foreground,
          textAlign: "center",
        }}
      >
        1位 {winner.name}
      </div>
      <div
        style={{
          fontSize: 64,
          fontWeight: FONT.weight.bold,
          color: "rgba(239,68,68,0.9)",
          textAlign: "center",
        }}
      >
        どうしてこうなった？
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export const BarChartRaceShort: React.FC<BarChartRaceShortProps> = ({
  frames: propsFrames,
  title: propsTitle,
  unit: propsUnit,
  topN = 15,
  framesPerYear = 36,
  theme = "dark",
  variant = "youtube",
  showSafeAreas = false,
  hookText,
  eventLabels: propsEventLabels,
  ctaHeadline,
  enableSpoilerHook = false,
  musicPath,
  colorScheme,
  endHoldFrames,
}) => {
  // fallback to mock data
  const frames = propsFrames && propsFrames.length > 0
    ? propsFrames
    : MOCK_BAR_CHART_RACE_FRAMES;
  const title = propsTitle || "都道府県別 人口ランキング";
  const unit = propsUnit || "千人";
  const eventLabels = propsEventLabels || MOCK_EVENT_LABELS;

  // BGM: 指定があればそれを、なければタイトルからハッシュで決定的に選択
  const bgmPath = React.useMemo(() => {
    if (musicPath) return musicPath;
    let hash = 0;
    for (let i = 0; i < title.length; i++) {
      hash = ((hash << 5) - hash + title.charCodeAt(i)) | 0;
    }
    return staticFile(BGM_FILES[Math.abs(hash) % BGM_FILES.length]);
  }, [musicPath, title]);

  const timeline = getBarChartRaceTimeline({
    frameCount: frames.length,
    framesPerYear,
    enableSpoilerHook,
    endHoldFrames,
  });

  return (
    <>
      <Audio src={bgmPath} />

      {/* Spoiler Hook (optional) */}
      {enableSpoilerHook && timeline.spoilerDuration > 0 && (
        <Sequence
          from={timeline.spoilerStart}
          durationInFrames={timeline.spoilerDuration}
          name="Spoiler"
        >
          <SpoilerScene frames={frames} theme={theme} />
        </Sequence>
      )}

      {/* Intro: タイルグリッドマップ付きイントロ */}
      <Sequence
        from={timeline.introStart}
        durationInFrames={SCENE_DURATION.intro}
        name="Intro"
      >
        <BarChartRaceIntro
          frames={frames}
          title={title}
          theme={theme}
          hookText={hookText}
          colorScheme={colorScheme}
        />
      </Sequence>

      {/* Race 本体 */}
      {timeline.raceDuration > 0 && (
        <Sequence
          from={timeline.raceStart}
          durationInFrames={timeline.raceDuration}
          name="BarChartRace"
        >
          <BarChartRaceScene
            frames={frames}
            title={title}
            unit={unit}
            topN={topN}
            framesPerYear={framesPerYear}
            theme={theme}
            eventLabels={eventLabels}
          />
        </Sequence>
      )}

      {/* CTA: ReelLastPage */}
      <Sequence
        from={timeline.ctaStart}
        durationInFrames={SCENE_DURATION.last}
        name="CTA"
      >
        <ReelLastPage
          theme={theme}
          variant={variant}
          headline={ctaHeadline}
        />
      </Sequence>

      {/* セーフエリア表示 (開発用) */}
      {showSafeAreas && <SafetyZoneOverlay />}
    </>
  );
};
