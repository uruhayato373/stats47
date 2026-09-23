import React from "react";
import { spring, useCurrentFrame, useVideoConfig } from "remotion";

import { formatValueWithPrecision } from "@stats47/utils";

import { IG_FONT, IG_SERIES, IgSeriesCard, IgSeriesReelFrame } from "@/features/ig-series";
import type { RankingMeta } from "@/shared";

import { toPrefCode, type ResolvedRankingQuiz } from "../quiz";

interface QuizReelBarsProps {
  quiz: ResolvedRankingQuiz;
  meta: RankingMeta;
  precision: number;
  sourceLabel: string;
}

const palette = IG_SERIES.quiz;

/** 上位の棒を1本ずつ伸ばす間隔（フレーム） */
const STAGGER = 8;

/** 13-16秒: 上位5県の棒が1位を基準に伸びる（値はすべて allEntries から・白カードで密なデータを見せる） */
export const QuizReelBars: React.FC<QuizReelBarsProps> = ({ quiz, meta, precision, sourceLabel }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const fmt = (v: number) => `${formatValueWithPrecision(v, precision)}${meta.unit}`;
  const first = quiz.top[0];

  return (
    <IgSeriesReelFrame series="quiz" tag="上位5県" sourceLabel={sourceLabel}>
      <IgSeriesCard
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 24,
          flex: 1,
          justifyContent: "center",
          padding: "28px 32px",
        }}
      >
        {quiz.top.map((entry, i) => {
          const isFirst = entry.rank === 1;
          const revealed = quiz.revealedRanks.has(toPrefCode(entry.areaCode));
          const targetWidth = Math.min(Math.max(entry.value / first.value, 0), 1) * 100;
          const s = spring({ frame: frame - i * STAGGER, fps, config: { damping: 16, mass: 0.6 } });
          const width = targetWidth * s;
          return (
            <div key={entry.areaCode} style={{ display: "flex", alignItems: "center", gap: 16 }}>
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
              <span style={{ width: 150, fontSize: 28, fontWeight: IG_FONT.weight.black }}>{entry.areaName}</span>
              <div
                style={{
                  flex: 1,
                  height: 40,
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
              <span style={{ width: 170, textAlign: "right", fontSize: 28, fontWeight: IG_FONT.weight.black }}>
                {fmt(entry.value)}
              </span>
            </div>
          );
        })}
      </IgSeriesCard>
      <p
        style={{
          fontSize: 26,
          fontWeight: IG_FONT.weight.bold,
          textAlign: "center",
          marginTop: 16,
          color: palette.inkSmall,
        }}
      >
        最下位は {quiz.last.areaName}（{fmt(quiz.last.value)}）
        {quiz.ratioToLast && <>。1位と約{quiz.ratioToLast}倍の差</>}
      </p>
    </IgSeriesReelFrame>
  );
};
