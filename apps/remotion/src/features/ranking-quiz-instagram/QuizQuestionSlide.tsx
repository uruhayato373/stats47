import React from "react";

import {
  IG_FONT,
  IG_HEADLINE_STYLE,
  IG_PILL_SOLID,
  IG_SERIES,
  IgSeriesCard,
  IgSeriesFrame,
} from "@/features/ig-series";

import type { RankingQuizSpec, ResolvedRankingQuiz } from "./quiz";

interface QuizQuestionSlideProps {
  spec: RankingQuizSpec;
  quiz: ResolvedRankingQuiz;
}

const palette = IG_SERIES.quiz;

/** 1枚目: 出題と選択肢。正解は3枚目で明かす */
export const QuizQuestionSlide: React.FC<QuizQuestionSlideProps> = ({ spec, quiz }) => (
  <IgSeriesFrame series="quiz" tag="都道府県クイズ" swipeLabel="答えは3枚目" sourceLabel={spec.sourceLabel}>
    <h1
      style={{
        ...IG_HEADLINE_STYLE,
        fontSize: 88,
        lineHeight: 1.4,
        marginTop: 44,
        letterSpacing: -1,
        whiteSpace: "pre-line",
      }}
    >
      {spec.question}
    </h1>
    <p style={{ fontSize: 30, fontWeight: IG_FONT.weight.bold, marginTop: 24, color: palette.inkSmall }}>
      {spec.scopeNote}
    </p>
    <div style={{ marginTop: 40, display: "flex", flexDirection: "column", gap: 20 }}>
      {quiz.choices.map((choice) => (
        <IgSeriesCard
          key={choice.prefCode}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 28,
            padding: "18px 32px",
          }}
        >
          <span
            style={{
              width: 72,
              height: 72,
              borderRadius: "50%",
              backgroundColor: IG_PILL_SOLID.background,
              color: IG_PILL_SOLID.ink,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 38,
              fontWeight: IG_FONT.weight.black,
              flexShrink: 0,
            }}
          >
            {choice.letter}
          </span>
          <span style={{ fontSize: 54, fontWeight: IG_FONT.weight.black }}>{choice.name}</span>
        </IgSeriesCard>
      ))}
    </div>
  </IgSeriesFrame>
);
