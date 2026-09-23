import React from "react";
import { spring, useCurrentFrame, useVideoConfig } from "remotion";

import { formatValueWithPrecision } from "@stats47/utils";

import { FONT, type RankingMeta } from "@/shared";

import { QUIZ_COLORS } from "../QuizFrame";
import { toPrefCode, type ResolvedRankingQuiz } from "../quiz";
import { QuizReelFrame } from "./QuizReelFrame";

interface QuizReelBarsProps {
  quiz: ResolvedRankingQuiz;
  meta: RankingMeta;
  precision: number;
  sourceLabel: string;
}

/** 上位の棒を1本ずつ伸ばす間隔（フレーム） */
const STAGGER = 8;

/** 13-16秒: 上位5県の棒が1位を基準に伸びる（値はすべて allEntries から） */
export const QuizReelBars: React.FC<QuizReelBarsProps> = ({ quiz, meta, precision, sourceLabel }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const fmt = (v: number) => `${formatValueWithPrecision(v, precision)}${meta.unit}`;
  const first = quiz.top[0];

  return (
    <QuizReelFrame pill="上位5県" sourceLabel={sourceLabel}>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 28,
          flex: 1,
          justifyContent: "center",
        }}
      >
        {quiz.top.map((entry, i) => {
          const isFirst = entry.rank === 1;
          const revealed = quiz.revealedRanks.has(toPrefCode(entry.areaCode));
          const targetWidth = Math.min(Math.max(entry.value / first.value, 0), 1) * 100;
          const s = spring({ frame: frame - i * STAGGER, fps, config: { damping: 16, mass: 0.6 } });
          const width = targetWidth * s;
          return (
            <div key={entry.areaCode} style={{ display: "flex", alignItems: "center", gap: 18 }}>
              <span
                style={{
                  width: 46,
                  fontSize: 34,
                  fontWeight: FONT.weight.black,
                  color: isFirst ? QUIZ_COLORS.highlight : QUIZ_COLORS.muted,
                }}
              >
                {entry.rank}
              </span>
              <span style={{ width: 160, fontSize: 32, fontWeight: FONT.weight.black }}>{entry.areaName}</span>
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
              <span style={{ width: 190, textAlign: "right", fontSize: 32, fontWeight: FONT.weight.black }}>
                {fmt(entry.value)}
              </span>
            </div>
          );
        })}
      </div>
      <p style={{ fontSize: 28, textAlign: "center" }}>
        最下位は {quiz.last.areaName}（{fmt(quiz.last.value)}）
        {quiz.ratioToLast && <>。1位と約{quiz.ratioToLast}倍の差</>}
      </p>
    </QuizReelFrame>
  );
};
