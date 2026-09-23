import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

import { IG_FONT, IG_PILL_SOLID, IgSeriesCard, IgSeriesReelFrame } from "@/features/ig-series";

import type { RankingQuizSpec, ResolvedRankingQuiz } from "../quiz";

interface QuizReelChoicesProps {
  spec: RankingQuizSpec;
  quiz: ResolvedRankingQuiz;
}

/** 選択肢を1つずつポップさせる間隔（フレーム） */
const STAGGER = 24;

/** 3-7秒: 選択肢（2〜4件・1位を必ず含む）を1つずつ見せる */
export const QuizReelChoices: React.FC<QuizReelChoicesProps> = ({ spec, quiz }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <IgSeriesReelFrame series="quiz" tag="どれだと思う？" tagVariant="outline" sourceLabel={spec.sourceLabel}>
      <p
        style={{
          fontSize: 32,
          fontWeight: IG_FONT.weight.bold,
          marginTop: 4,
          lineHeight: 1.5,
          whiteSpace: "pre-line",
        }}
      >
        {spec.question}
      </p>
      <div style={{ marginTop: 32, display: "flex", flexDirection: "column", gap: 22 }}>
        {quiz.choices.map((choice, i) => {
          const s = spring({ frame: frame - i * STAGGER, fps, config: { damping: 12, mass: 0.7 } });
          return (
            <IgSeriesCard
              key={choice.prefCode}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 30,
                padding: "22px 36px",
                opacity: s,
                transform: `translateX(${interpolate(s, [0, 1], [-70, 0])}px)`,
              }}
            >
              <span
                style={{
                  width: 66,
                  height: 66,
                  borderRadius: "50%",
                  backgroundColor: IG_PILL_SOLID.background,
                  color: IG_PILL_SOLID.ink,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 36,
                  fontWeight: IG_FONT.weight.black,
                  flexShrink: 0,
                }}
              >
                {choice.letter}
              </span>
              <span style={{ fontSize: 48, fontWeight: IG_FONT.weight.black }}>{choice.name}</span>
            </IgSeriesCard>
          );
        })}
      </div>
    </IgSeriesReelFrame>
  );
};
