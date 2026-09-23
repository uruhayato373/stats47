import React from "react";

import { formatValueWithPrecision } from "@stats47/utils";

import {
  IG_FONT,
  IG_HEADLINE_STYLE,
  IG_NUMBER_STYLE,
  IgSeriesCard,
  IgSeriesEmphasis,
  IgSeriesFrame,
} from "@/features/ig-series";
import type { RankingMeta } from "@/shared";

import { toPrefCode, type RankingQuizSpec, type ResolvedRankingQuiz } from "./quiz";

interface QuizAnswerSlideProps {
  spec: RankingQuizSpec;
  quiz: ResolvedRankingQuiz;
  meta: RankingMeta;
  precision: number;
}

const SERIES = "quiz" as const;

/** 3枚目: 正解。1位の値・2位との倍率・上位5・最下位との差をデータから出す（密なデータなので白カードに集約） */
export const QuizAnswerSlide: React.FC<QuizAnswerSlideProps> = ({ spec, quiz, meta, precision }) => {
  const [first, second] = quiz.top;
  const fmt = (v: number) => `${formatValueWithPrecision(v, precision)}${meta.unit}`;

  return (
    <IgSeriesFrame series={SERIES} tag={`正解は ${quiz.answerLetter}`} swipeLabel="全47都道府県は次へ" sourceLabel={spec.sourceLabel}>
      <IgSeriesCard style={{ marginTop: 32, padding: "32px 36px 28px", display: "flex", flexDirection: "column" }}>
        <div style={{ ...IG_HEADLINE_STYLE, fontSize: 100, lineHeight: 1 }}>{first.areaName}</div>
        <div style={{ marginTop: 14, fontSize: 60 }}>
          <span style={{ ...IG_NUMBER_STYLE }}>{formatValueWithPrecision(first.value, precision)}</span>
          <span style={{ fontSize: 30, color: "#64748B", fontWeight: IG_FONT.weight.bold, fontFamily: IG_FONT.body }}>
            {meta.unit}
          </span>
        </div>
        <p style={{ fontSize: 28, fontWeight: IG_FONT.weight.bold, marginTop: 14, lineHeight: 1.5 }}>
          2位 {second.areaName}（{fmt(second.value)}）
          {quiz.ratioToRunnerUp && (
            <>
              の
              <IgSeriesEmphasis series={SERIES}>約{quiz.ratioToRunnerUp}倍</IgSeriesEmphasis>
            </>
          )}
        </p>
        <div style={{ marginTop: 26, display: "flex", flexDirection: "column", gap: 14 }}>
          {quiz.top.map((entry) => {
            const isFirst = entry.rank === 1;
            const revealed = quiz.revealedRanks.has(toPrefCode(entry.areaCode));
            const width = Math.min(Math.max(entry.value / first.value, 0), 1) * 100;
            return (
              <div key={entry.areaCode} style={{ display: "flex", alignItems: "center", gap: 18 }}>
                <span
                  style={{
                    width: 42,
                    fontSize: 30,
                    fontWeight: IG_FONT.weight.black,
                    color: isFirst ? undefined : "#94A3B8",
                  }}
                >
                  {entry.rank}
                </span>
                <span style={{ width: 170, fontSize: 28, fontWeight: IG_FONT.weight.black }}>
                  {entry.areaName}
                </span>
                <div
                  style={{
                    flex: 1,
                    height: 38,
                    backgroundColor: "#F1F5F9",
                    borderRadius: 8,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: `${width}%`,
                      height: "100%",
                      borderRadius: 8,
                      backgroundColor: isFirst ? "#111111" : revealed ? "#B45309" : "#CBD5E1",
                    }}
                  />
                </div>
                <span style={{ width: 180, textAlign: "right", fontSize: 28, fontWeight: IG_FONT.weight.black }}>
                  {fmt(entry.value)}
                </span>
              </div>
            );
          })}
        </div>
        <p style={{ fontSize: 24, fontWeight: IG_FONT.weight.bold, marginTop: 22 }}>
          最下位は {quiz.last.areaName}（{fmt(quiz.last.value)}）
          {quiz.ratioToLast && (
            <>
              。1位と<IgSeriesEmphasis series={SERIES}>約{quiz.ratioToLast}倍</IgSeriesEmphasis>の差
            </>
          )}
        </p>
        {spec.footnote && (
          <p style={{ fontSize: 20, marginTop: 16, color: "#64748B", lineHeight: 1.6 }}>※{spec.footnote}</p>
        )}
      </IgSeriesCard>
    </IgSeriesFrame>
  );
};
