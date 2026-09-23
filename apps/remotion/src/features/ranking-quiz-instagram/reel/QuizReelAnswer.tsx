import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

import { formatValueWithPrecision } from "@stats47/utils";

import {
  IG_FONT,
  IG_HEADLINE_STYLE,
  IG_NUMBER_STYLE,
  IG_SERIES,
  IgSeriesReelFrame,
} from "@/features/ig-series";
import type { RankingMeta } from "@/shared";

import type { RankingQuizSpec, ResolvedRankingQuiz } from "../quiz";

interface QuizReelAnswerProps {
  spec: RankingQuizSpec;
  quiz: ResolvedRankingQuiz;
  meta: RankingMeta;
  precision: number;
}

const palette = IG_SERIES.quiz;

/** 10-13秒: 正解を発表（1位の県・値・2位との倍率）。scopeNote/footnote は必ず表示する */
export const QuizReelAnswer: React.FC<QuizReelAnswerProps> = ({ spec, quiz, meta, precision }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const [first, second] = quiz.top;
  const nameSpring = spring({ frame, fps, config: { damping: 11, mass: 1 } });
  const valueSpring = spring({ frame: frame - 12, fps, config: { damping: 12 } });

  return (
    <IgSeriesReelFrame series="quiz" tag={`正解は ${quiz.answerLetter}`} sourceLabel={spec.sourceLabel}>
      <div
        style={{
          ...IG_HEADLINE_STYLE,
          fontSize: 150,
          lineHeight: 1,
          opacity: nameSpring,
          transform: `scale(${interpolate(nameSpring, [0, 1], [0.7, 1])})`,
        }}
      >
        {first.areaName}
      </div>
      <div
        style={{
          marginTop: 24,
          fontSize: 84,
          opacity: valueSpring,
          transform: `translateY(${interpolate(valueSpring, [0, 1], [24, 0])}px)`,
        }}
      >
        <span style={{ ...IG_NUMBER_STYLE }}>{formatValueWithPrecision(first.value, precision)}</span>
        <span style={{ fontSize: 40, fontWeight: IG_FONT.weight.bold }}>{meta.unit}</span>
      </div>
      <p style={{ fontSize: 34, fontWeight: IG_FONT.weight.bold, marginTop: 20, lineHeight: 1.5 }}>
        2位 {second.areaName}（{formatValueWithPrecision(second.value, precision)}
        {meta.unit}）
        {quiz.ratioToRunnerUp && <>の約{quiz.ratioToRunnerUp}倍</>}
      </p>
      <p style={{ fontSize: 26, fontWeight: IG_FONT.weight.bold, marginTop: 8, color: palette.inkSmall }}>
        {spec.scopeNote}
      </p>
      {spec.footnote && (
        <p
          style={{
            fontSize: 24,
            fontWeight: IG_FONT.weight.bold,
            marginTop: 48,
            lineHeight: 1.6,
            color: palette.inkSmall,
          }}
        >
          ※{spec.footnote}
        </p>
      )}
    </IgSeriesReelFrame>
  );
};
