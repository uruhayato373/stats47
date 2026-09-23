import React from "react";

import { FONT } from "@/shared";

import { QUIZ_COLORS, QuizFrame } from "./QuizFrame";
import type { RankingQuizSpec, ResolvedRankingQuiz } from "./quiz";

interface QuizQuestionSlideProps {
  spec: RankingQuizSpec;
  quiz: ResolvedRankingQuiz;
}

/** 1枚目: 出題と選択肢。正解は3枚目で明かす */
export const QuizQuestionSlide: React.FC<QuizQuestionSlideProps> = ({ spec, quiz }) => (
  <QuizFrame pill="都道府県クイズ" swipeLabel="答えは3枚目" sourceLabel={spec.sourceLabel}>
    <h1
      style={{
        fontSize: 88,
        fontWeight: FONT.weight.black,
        lineHeight: 1.25,
        marginTop: 44,
        whiteSpace: "pre-line",
      }}
    >
      {spec.question}
    </h1>
    <p style={{ fontSize: 30, color: QUIZ_COLORS.muted, marginTop: 28 }}>{spec.scopeNote}</p>
    <div style={{ marginTop: 48, display: "flex", flexDirection: "column", gap: 20 }}>
      {quiz.choices.map((choice) => (
        <div
          key={choice.prefCode}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 36,
            backgroundColor: QUIZ_COLORS.card,
            border: `2px solid ${QUIZ_COLORS.border}`,
            borderRadius: 24,
            padding: "22px 40px",
          }}
        >
          <span
            style={{
              width: 72,
              height: 72,
              borderRadius: "50%",
              backgroundColor: QUIZ_COLORS.background,
              border: `3px solid ${QUIZ_COLORS.highlight}`,
              color: QUIZ_COLORS.highlight,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 40,
              fontWeight: FONT.weight.black,
            }}
          >
            {choice.letter}
          </span>
          <span style={{ fontSize: 54, fontWeight: FONT.weight.black }}>{choice.name}</span>
        </div>
      ))}
    </div>
  </QuizFrame>
);
