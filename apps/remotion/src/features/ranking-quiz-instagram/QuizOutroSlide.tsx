import React from "react";

import { FONT } from "@/shared";

import { QUIZ_COLORS, QuizFrame } from "./QuizFrame";
import type { RankingQuizSpec } from "./quiz";

interface QuizOutroSlideProps {
  spec: RankingQuizSpec;
}

const card: React.CSSProperties = {
  backgroundColor: QUIZ_COLORS.card,
  border: `2px solid ${QUIZ_COLORS.border}`,
  borderRadius: 24,
  padding: "32px 40px",
  fontSize: 38,
  fontWeight: FONT.weight.bold,
};

/** 5枚目: コメント・保存・プロフィール導線 */
export const QuizOutroSlide: React.FC<QuizOutroSlideProps> = ({ spec }) => (
  <QuizFrame pill="都道府県クイズ" sourceLabel={spec.sourceLabel}>
    <div style={{ marginTop: 150 }}>
      <h1 style={{ fontSize: 92, fontWeight: FONT.weight.black, lineHeight: 1.3 }}>
        あなたの県は
        <br />
        <span style={{ color: QUIZ_COLORS.highlight }}>何位</span>でしたか？
      </h1>
      <p style={{ fontSize: 40, marginTop: 36, color: QUIZ_COLORS.muted, lineHeight: 1.5 }}>
        予想が当たった人も外れた人も
        <br />
        コメントで教えてください
      </p>
      <div style={{ marginTop: 72, display: "flex", flexDirection: "column", gap: 24 }}>
        <div style={card}>
          <span style={{ color: QUIZ_COLORS.highlight }}>保存</span>して、{spec.saveReason ?? "友だちにも出題してみて"}
        </div>
        <div style={card}>
          全47都道府県は<span style={{ color: QUIZ_COLORS.accent }}>プロフィールのリンク</span>から
        </div>
      </div>
    </div>
  </QuizFrame>
);
