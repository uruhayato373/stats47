import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

import {
  IG_FONT,
  IG_HEADLINE_STYLE,
  IgSeriesCard,
  IgSeriesEmphasis,
  IgSeriesReelFrame,
} from "@/features/ig-series";

import type { RankingQuizSpec } from "../quiz";

interface QuizReelOutroProps {
  spec: RankingQuizSpec;
}

const SERIES = "quiz" as const;

/** 16-18秒: 保存・プロフィール導線（締め。音声なし） */
export const QuizReelOutro: React.FC<QuizReelOutroProps> = ({ spec }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const titleSpring = spring({ frame, fps, config: { damping: 14 } });
  const cardsSpring = spring({ frame: frame - 10, fps, config: { damping: 14 } });

  return (
    <IgSeriesReelFrame series={SERIES} tag="都道府県クイズ" sourceLabel={spec.sourceLabel}>
      <div
        style={{
          opacity: titleSpring,
          transform: `translateY(${interpolate(titleSpring, [0, 1], [24, 0])}px)`,
        }}
      >
        <h1 style={{ ...IG_HEADLINE_STYLE, fontSize: 72, lineHeight: 1.4 }}>
          あなたの県は
          <br />
          何位でしたか？
        </h1>
      </div>
      <div
        style={{
          marginTop: 44,
          display: "flex",
          flexDirection: "column",
          gap: 22,
          opacity: cardsSpring,
          transform: `translateY(${interpolate(cardsSpring, [0, 1], [24, 0])}px)`,
        }}
      >
        <IgSeriesCard style={{ padding: "24px 32px", fontSize: 32, fontWeight: IG_FONT.weight.bold }}>
          <IgSeriesEmphasis series={SERIES}>保存</IgSeriesEmphasis>して、
          {spec.saveReason ?? "友だちにも出題してみて"}
        </IgSeriesCard>
        <IgSeriesCard style={{ padding: "24px 32px", fontSize: 32, fontWeight: IG_FONT.weight.bold }}>
          全47都道府県は<IgSeriesEmphasis series={SERIES}>プロフィールのリンク</IgSeriesEmphasis>から
        </IgSeriesCard>
      </div>
    </IgSeriesReelFrame>
  );
};
