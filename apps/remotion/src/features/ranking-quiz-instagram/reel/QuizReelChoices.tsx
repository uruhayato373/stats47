import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

import { FONT } from "@/shared";

import { QUIZ_COLORS } from "../QuizFrame";
import type { RankingQuizSpec, ResolvedRankingQuiz } from "../quiz";
import { QuizReelFrame } from "./QuizReelFrame";

interface QuizReelChoicesProps {
  spec: RankingQuizSpec;
  quiz: ResolvedRankingQuiz;
}

/** 選択肢を1つずつポップさせる間隔（フレーム） */
const STAGGER = 24;

/** 3-7秒: 選択肢（2〜4件・1位を必ず含む）を1つずつ見せる */
export const QuizReelChoices: React.FC<QuizReelChoicesProps> = ({ spec, quiz }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <QuizReelFrame pill="どれだと思う？" pillVariant="outline" sourceLabel={spec.sourceLabel}>
      <p
        style={{
          fontSize: 34,
          color: QUIZ_COLORS.muted,
          marginTop: 4,
          lineHeight: 1.5,
          whiteSpace: "pre-line",
        }}
      >
        {spec.question}
      </p>
      <div style={{ marginTop: 36, display: "flex", flexDirection: "column", gap: 24 }}>
        {quiz.choices.map((choice, i) => {
          const s = spring({ frame: frame - i * STAGGER, fps, config: { damping: 12, mass: 0.7 } });
          return (
            <div
              key={choice.prefCode}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 32,
                backgroundColor: QUIZ_COLORS.card,
                border: `2px solid ${QUIZ_COLORS.border}`,
                borderRadius: 24,
                padding: "24px 40px",
                opacity: s,
                transform: `translateX(${interpolate(s, [0, 1], [-70, 0])}px)`,
              }}
            >
              <span
                style={{
                  width: 68,
                  height: 68,
                  borderRadius: "50%",
                  backgroundColor: QUIZ_COLORS.background,
                  border: `3px solid ${QUIZ_COLORS.highlight}`,
                  color: QUIZ_COLORS.highlight,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 38,
                  fontWeight: FONT.weight.black,
                  flexShrink: 0,
                }}
              >
                {choice.letter}
              </span>
              <span style={{ fontSize: 50, fontWeight: FONT.weight.black }}>{choice.name}</span>
            </div>
          );
        })}
      </div>
    </QuizReelFrame>
  );
};
