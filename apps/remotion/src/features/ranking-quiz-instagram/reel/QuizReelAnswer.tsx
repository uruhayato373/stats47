import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

import { formatValueWithPrecision } from "@stats47/utils";

import { FONT, type RankingMeta } from "@/shared";

import { QUIZ_COLORS } from "../QuizFrame";
import type { RankingQuizSpec, ResolvedRankingQuiz } from "../quiz";
import { QuizReelFrame } from "./QuizReelFrame";

interface QuizReelAnswerProps {
  spec: RankingQuizSpec;
  quiz: ResolvedRankingQuiz;
  meta: RankingMeta;
  precision: number;
}

const Emph: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <b style={{ color: QUIZ_COLORS.highlight, fontWeight: FONT.weight.black }}>{children}</b>
);

/** 10-13秒: 正解を発表（1位の県・値・2位との倍率）。scopeNote/footnote は必ず表示する */
export const QuizReelAnswer: React.FC<QuizReelAnswerProps> = ({ spec, quiz, meta, precision }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const [first, second] = quiz.top;
  const nameSpring = spring({ frame, fps, config: { damping: 11, mass: 1 } });
  const valueSpring = spring({ frame: frame - 12, fps, config: { damping: 12 } });

  return (
    <QuizReelFrame pill={`正解は ${quiz.answerLetter}`} sourceLabel={spec.sourceLabel}>
      <div
        style={{
          fontSize: 168,
          fontWeight: FONT.weight.black,
          color: QUIZ_COLORS.highlight,
          lineHeight: 1,
          opacity: nameSpring,
          transform: `scale(${interpolate(nameSpring, [0, 1], [0.7, 1])})`,
        }}
      >
        {first.areaName}
      </div>
      <div
        style={{
          marginTop: 26,
          fontSize: 92,
          fontWeight: FONT.weight.black,
          opacity: valueSpring,
          transform: `translateY(${interpolate(valueSpring, [0, 1], [24, 0])}px)`,
        }}
      >
        {formatValueWithPrecision(first.value, precision)}
        <span style={{ fontSize: 44, color: QUIZ_COLORS.muted, fontWeight: FONT.weight.bold }}>{meta.unit}</span>
      </div>
      <p style={{ fontSize: 36, marginTop: 22, lineHeight: 1.5 }}>
        2位 {second.areaName}（{formatValueWithPrecision(second.value, precision)}
        {meta.unit}）
        {quiz.ratioToRunnerUp && (
          <>
            の<Emph>約{quiz.ratioToRunnerUp}倍</Emph>
          </>
        )}
      </p>
      <p style={{ fontSize: 28, marginTop: 8, color: QUIZ_COLORS.muted }}>{spec.scopeNote}</p>
      {spec.footnote && (
        <p style={{ fontSize: 26, marginTop: 56, color: QUIZ_COLORS.muted, lineHeight: 1.6 }}>
          ※{spec.footnote}
        </p>
      )}
    </QuizReelFrame>
  );
};
