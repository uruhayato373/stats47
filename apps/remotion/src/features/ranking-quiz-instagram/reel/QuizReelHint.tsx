import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

import {
  IG_FONT,
  IG_HEADLINE_STYLE,
  IG_NUMBER_STYLE,
  IG_SERIES,
  IgSeriesCard,
  IgSeriesReelFrame,
} from "@/features/ig-series";

import { type RankingQuizSpec, type ResolvedRankingQuiz } from "../quiz";
import { HINT_MAP, hintTiles } from "../QuizHintSlide";
import { QUIZ_REEL_SCENE_DURATION } from "./timeline";

const palette = IG_SERIES.quiz;

/** カウントダウンはシーン末尾の3ステップ（3→2→1）。尺は timeline.ts の SSOT から逆算する */
const COUNTDOWN_LABELS = ["3", "2", "1"];
const COUNTDOWN_STEP = 20;
const COUNTDOWN_START = QUIZ_REEL_SCENE_DURATION.hint - COUNTDOWN_STEP * COUNTDOWN_LABELS.length;

interface QuizReelHintProps {
  spec: RankingQuizSpec;
  quiz: ResolvedRankingQuiz;
}

/** 7-10秒: 候補を「?」で伏せたタイル地図（白カード） + 答え合わせへの3-2-1カウントダウン */
export const QuizReelHint: React.FC<QuizReelHintProps> = ({ spec, quiz }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const bodySpring = spring({ frame, fps, config: { damping: 14 } });

  const countdownFrame = frame - COUNTDOWN_START;
  const countdownIndex = Math.floor(countdownFrame / COUNTDOWN_STEP);
  const showCountdown = countdownFrame >= 0 && countdownIndex < COUNTDOWN_LABELS.length;
  const countdownLocalFrame = countdownFrame - countdownIndex * COUNTDOWN_STEP;
  const countdownSpring = showCountdown
    ? spring({ frame: countdownLocalFrame, fps, config: { damping: 8, mass: 0.5 } })
    : 0;

  return (
    <IgSeriesReelFrame series="quiz" tag="ヒント" tagVariant="outline" sourceLabel={spec.sourceLabel}>
      <h1
        style={{
          ...IG_HEADLINE_STYLE,
          fontSize: 52,
          lineHeight: 1.4,
          opacity: bodySpring,
          transform: `translateY(${interpolate(bodySpring, [0, 1], [24, 0])}px)`,
        }}
      >
        {spec.hint.headline}
        <br />
        {spec.hint.accent}
      </h1>
      <p
        style={{
          fontSize: 26,
          fontWeight: IG_FONT.weight.bold,
          marginTop: 10,
          lineHeight: 1.6,
          whiteSpace: "pre-line",
          color: palette.inkSmall,
        }}
      >
        {spec.hint.body}
      </p>
      <IgSeriesCard style={{ position: "relative", flex: 1, minHeight: 0, marginTop: 18, padding: 16 }}>
        <svg
          viewBox={`0 0 ${HINT_MAP.width} ${HINT_MAP.height}`}
          style={{ width: "100%", height: "100%" }}
          dangerouslySetInnerHTML={{ __html: hintTiles(quiz) }}
        />
        {showCountdown && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              pointerEvents: "none",
            }}
          >
            <span
              style={{
                ...IG_NUMBER_STYLE,
                fontSize: 240,
                color: palette.accent,
                textShadow: "0 0 40px rgba(255,255,255,0.9)",
                opacity: interpolate(countdownSpring, [0, 1], [0, 1]),
                transform: `scale(${interpolate(countdownSpring, [0, 1], [1.6, 1])})`,
              }}
            >
              {COUNTDOWN_LABELS[countdownIndex]}
            </span>
          </div>
        )}
      </IgSeriesCard>
    </IgSeriesReelFrame>
  );
};
