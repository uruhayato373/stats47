import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

import { IG_FONT, IG_HEADLINE_STYLE, IG_SERIES, IgSeriesReelFrame } from "@/features/ig-series";

import type { RankingQuizSpec } from "../quiz";

interface QuizReelHookProps {
  spec: RankingQuizSpec;
}

const palette = IG_SERIES.quiz;

/** 0-3秒: 「予想してみて」の一言 + 出題を大きく見せるフック */
export const QuizReelHook: React.FC<QuizReelHookProps> = ({ spec }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const hookSpring = spring({ frame, fps, config: { damping: 14 } });
  const questionSpring = spring({ frame: frame - 12, fps, config: { damping: 14 } });

  return (
    <IgSeriesReelFrame series="quiz" tag="都道府県クイズ" sourceLabel={spec.sourceLabel}>
      <div
        style={{
          fontSize: 44,
          fontWeight: IG_FONT.weight.black,
          opacity: hookSpring,
          transform: `translateY(${interpolate(hookSpring, [0, 1], [24, 0])}px)`,
        }}
      >
        予想してみて
      </div>
      <h1
        style={{
          ...IG_HEADLINE_STYLE,
          fontSize: 84,
          lineHeight: 1.4,
          marginTop: 32,
          whiteSpace: "pre-line",
          opacity: questionSpring,
          transform: `translateY(${interpolate(questionSpring, [0, 1], [36, 0])}px)`,
        }}
      >
        {spec.question}
      </h1>
      <p style={{ fontSize: 30, fontWeight: IG_FONT.weight.bold, marginTop: 24, color: palette.inkSmall }}>
        {spec.scopeNote}
      </p>
    </IgSeriesReelFrame>
  );
};
