import React from "react";

import { formatValueWithPrecision } from "@stats47/utils";

import { FONT, type RankingMeta } from "@/shared";

import { QUIZ_COLORS, QuizFrame } from "./QuizFrame";
import { toPrefCode, type RankingQuizSpec, type ResolvedRankingQuiz } from "./quiz";

interface QuizAnswerSlideProps {
  spec: RankingQuizSpec;
  quiz: ResolvedRankingQuiz;
  meta: RankingMeta;
  precision: number;
}

const Emph: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <b style={{ color: QUIZ_COLORS.highlight, fontWeight: FONT.weight.black }}>{children}</b>
);

/** 3枚目: 正解。1位の値・2位との倍率・上位5・最下位との差をデータから出す */
export const QuizAnswerSlide: React.FC<QuizAnswerSlideProps> = ({ spec, quiz, meta, precision }) => {
  const [first, second] = quiz.top;
  const fmt = (v: number) => `${formatValueWithPrecision(v, precision)}${meta.unit}`;

  return (
    <QuizFrame pill={`正解は ${quiz.answerLetter}`} swipeLabel="全47都道府県は次へ" sourceLabel={spec.sourceLabel}>
      <div
        style={{
          marginTop: 44,
          fontSize: 150,
          fontWeight: FONT.weight.black,
          color: QUIZ_COLORS.highlight,
          lineHeight: 1,
        }}
      >
        {first.areaName}
      </div>
      <div style={{ marginTop: 22, fontSize: 84, fontWeight: FONT.weight.black }}>
        {formatValueWithPrecision(first.value, precision)}
        <span style={{ fontSize: 40, color: QUIZ_COLORS.muted, fontWeight: FONT.weight.bold }}>
          {meta.unit}
        </span>
      </div>
      <p style={{ fontSize: 36, marginTop: 18, lineHeight: 1.5 }}>
        2位 {second.areaName}（{fmt(second.value)}）
        {quiz.ratioToRunnerUp && (
          <>
            の<Emph>約{quiz.ratioToRunnerUp}倍</Emph>
          </>
        )}
      </p>
      <div style={{ marginTop: 48, display: "flex", flexDirection: "column", gap: 18 }}>
        {quiz.top.map((entry) => {
          const isFirst = entry.rank === 1;
          const revealed = quiz.revealedRanks.has(toPrefCode(entry.areaCode));
          const width = Math.min(Math.max(entry.value / first.value, 0), 1) * 100;
          return (
            <div key={entry.areaCode} style={{ display: "flex", alignItems: "center", gap: 24 }}>
              <span
                style={{
                  width: 50,
                  fontSize: 36,
                  fontWeight: FONT.weight.black,
                  color: isFirst ? QUIZ_COLORS.highlight : QUIZ_COLORS.muted,
                }}
              >
                {entry.rank}
              </span>
              <span style={{ width: 200, fontSize: 34, fontWeight: FONT.weight.black }}>
                {entry.areaName}
              </span>
              <div
                style={{
                  flex: 1,
                  height: 44,
                  backgroundColor: QUIZ_COLORS.card,
                  borderRadius: 10,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${width}%`,
                    height: "100%",
                    borderRadius: 10,
                    backgroundColor: isFirst
                      ? QUIZ_COLORS.highlight
                      : revealed
                        ? QUIZ_COLORS.accent
                        : QUIZ_COLORS.highlightMuted,
                  }}
                />
              </div>
              <span style={{ width: 210, textAlign: "right", fontSize: 34, fontWeight: FONT.weight.black }}>
                {fmt(entry.value)}
              </span>
            </div>
          );
        })}
      </div>
      <p style={{ fontSize: 32, marginTop: 40 }}>
        最下位は {quiz.last.areaName}（{fmt(quiz.last.value)}）
        {quiz.ratioToLast && (
          <>
            。1位と<Emph>約{quiz.ratioToLast}倍</Emph>の差
          </>
        )}
      </p>
      {spec.footnote && (
        <p style={{ fontSize: 24, marginTop: 22, color: QUIZ_COLORS.muted, lineHeight: 1.6 }}>
          ※{spec.footnote}
        </p>
      )}
    </QuizFrame>
  );
};
