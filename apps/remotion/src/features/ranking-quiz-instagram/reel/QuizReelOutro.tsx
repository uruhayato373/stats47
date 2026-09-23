import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

import { FONT } from "@/shared";

import { QUIZ_COLORS } from "../QuizFrame";
import type { RankingQuizSpec } from "../quiz";
import { QuizReelFrame } from "./QuizReelFrame";

interface QuizReelOutroProps {
  spec: RankingQuizSpec;
}

const card: React.CSSProperties = {
  backgroundColor: QUIZ_COLORS.card,
  border: `2px solid ${QUIZ_COLORS.border}`,
  borderRadius: 24,
  padding: "26px 34px",
  fontSize: 32,
  fontWeight: FONT.weight.bold,
};

/** 16-18秒: 保存・プロフィール導線（締め。音声なし） */
export const QuizReelOutro: React.FC<QuizReelOutroProps> = ({ spec }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const titleSpring = spring({ frame, fps, config: { damping: 14 } });
  const cardsSpring = spring({ frame: frame - 10, fps, config: { damping: 14 } });

  return (
    <QuizReelFrame pill="都道府県クイズ" sourceLabel={spec.sourceLabel}>
      <div
        style={{
          opacity: titleSpring,
          transform: `translateY(${interpolate(titleSpring, [0, 1], [24, 0])}px)`,
        }}
      >
        <h1 style={{ fontSize: 80, fontWeight: FONT.weight.black, lineHeight: 1.3 }}>
          あなたの県は
          <br />
          <span style={{ color: QUIZ_COLORS.highlight }}>何位</span>でしたか？
        </h1>
      </div>
      <div
        style={{
          marginTop: 48,
          display: "flex",
          flexDirection: "column",
          gap: 24,
          opacity: cardsSpring,
          transform: `translateY(${interpolate(cardsSpring, [0, 1], [24, 0])}px)`,
        }}
      >
        <div style={card}>
          <span style={{ color: QUIZ_COLORS.highlight }}>保存</span>して、
          {spec.saveReason ?? "友だちにも出題してみて"}
        </div>
        <div style={card}>
          全47都道府県は<span style={{ color: QUIZ_COLORS.accent }}>プロフィールのリンク</span>から
        </div>
      </div>
    </QuizReelFrame>
  );
};
