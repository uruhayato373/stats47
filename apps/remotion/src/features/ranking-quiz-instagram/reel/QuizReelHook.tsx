import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

import { FONT } from "@/shared";

import { QUIZ_COLORS } from "../QuizFrame";
import type { RankingQuizSpec } from "../quiz";
import { QuizReelFrame } from "./QuizReelFrame";

interface QuizReelHookProps {
  spec: RankingQuizSpec;
}

/** 0-3秒: 「予想してみて」の一言 + 出題を大きく見せるフック */
export const QuizReelHook: React.FC<QuizReelHookProps> = ({ spec }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const hookSpring = spring({ frame, fps, config: { damping: 14 } });
  const questionSpring = spring({ frame: frame - 12, fps, config: { damping: 14 } });

  return (
    <QuizReelFrame pill="都道府県クイズ" sourceLabel={spec.sourceLabel}>
      <div
        style={{
          fontSize: 44,
          fontWeight: FONT.weight.black,
          color: QUIZ_COLORS.highlight,
          opacity: hookSpring,
          transform: `translateY(${interpolate(hookSpring, [0, 1], [24, 0])}px)`,
        }}
      >
        予想してみて
      </div>
      <h1
        style={{
          fontSize: 92,
          fontWeight: FONT.weight.black,
          lineHeight: 1.28,
          marginTop: 36,
          whiteSpace: "pre-line",
          opacity: questionSpring,
          transform: `translateY(${interpolate(questionSpring, [0, 1], [36, 0])}px)`,
        }}
      >
        {spec.question}
      </h1>
      <p style={{ fontSize: 32, color: QUIZ_COLORS.muted, marginTop: 28 }}>{spec.scopeNote}</p>
    </QuizReelFrame>
  );
};
