import React from "react";
import { Audio, Sequence, staticFile } from "remotion";
import type { BarChartRaceFrame } from "@stats47/visualization";

import { type ThemeName } from "@/shared";
import { SCENE_DURATION } from "@/utils/constants";
import {
  getBarChartRaceTimeline,
  type EventLabel,
} from "../../shared/utils/bar-chart-race";
import {
  MOCK_BAR_CHART_RACE_FRAMES,
  MOCK_EVENT_LABELS,
} from "../../shared/utils/mock-bar-chart-race-data";
import { BarChartRaceNormalScene } from "./BarChartRaceNormalScene";
import { NormalIntro } from "./NormalIntro";
import { NormalOutro } from "./NormalOutro";

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

export interface BarChartRaceNormalProps {
  frames?: BarChartRaceFrame[];
  title?: string;
  unit?: string;
  topN?: number;
  framesPerYear?: number;
  theme?: ThemeName;
  hookText?: string;
  eventLabels?: EventLabel[];
  /** Spoiler Hook を有効にするか @default false */
  enableSpoilerHook?: boolean;
  /** 最終年度を固定表示するフレーム数 @default 90 (3秒) */
  endHoldFrames?: number;
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export const BarChartRaceNormal: React.FC<BarChartRaceNormalProps> = ({
  frames: propsFrames,
  title: propsTitle,
  unit: propsUnit,
  topN = 47,
  framesPerYear = 36,
  theme = "dark",
  hookText,
  eventLabels: propsEventLabels,
  enableSpoilerHook = false,
  endHoldFrames,
}) => {
  // fallback to mock data
  const frames = propsFrames && propsFrames.length > 0
    ? propsFrames
    : MOCK_BAR_CHART_RACE_FRAMES;
  const title = propsTitle || "都道府県別 人口ランキング";
  const unit = propsUnit || "千人";
  const eventLabels = propsEventLabels || MOCK_EVENT_LABELS;

  // BGM: タイトルからハッシュで決定的に選択
  const bgmPath = React.useMemo(() => {
    let hash = 0;
    for (let i = 0; i < title.length; i++) {
      hash = ((hash << 5) - hash + title.charCodeAt(i)) | 0;
    }
    return staticFile(BGM_FILES[Math.abs(hash) % BGM_FILES.length]);
  }, [title]);

  const timeline = getBarChartRaceTimeline({
    frameCount: frames.length,
    framesPerYear,
    enableSpoilerHook,
    endHoldFrames,
  });

  // 期間テキスト (NormalIntro 用)
  const dateRange = frames.length > 0
    ? `${frames[0].date} 〜 ${frames[frames.length - 1].date}`
    : undefined;

  return (
    <>
      <Audio src={bgmPath} />

      {/* Intro: NormalIntro (120フレーム / 4秒) */}
      <Sequence
        from={timeline.introStart}
        durationInFrames={SCENE_DURATION.intro}
        name="Intro"
      >
        <NormalIntro
          title={title}
          theme={theme}
          hookText={hookText}
          yearName={dateRange}
        />
      </Sequence>

      {/* Race 本体 */}
      {timeline.raceDuration > 0 && (
        <Sequence
          from={timeline.raceStart}
          durationInFrames={timeline.raceDuration}
          name="BarChartRace"
        >
          <BarChartRaceNormalScene
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

      {/* Outro: NormalOutro (150フレーム / 5秒) */}
      <Sequence
        from={timeline.ctaStart}
        durationInFrames={SCENE_DURATION.last}
        name="Outro"
      >
        <NormalOutro theme={theme} />
      </Sequence>
    </>
  );
};
