import React from "react";

import { IG_FONT, IG_HEADLINE_STYLE, IgSeriesCard, IgSeriesEmphasis, IgSeriesFrame } from "@/features/ig-series";

import type { RankingQuizSpec } from "./quiz";

interface QuizOutroSlideProps {
  spec: RankingQuizSpec;
}

const SERIES = "quiz" as const;

/** 5枚目: コメント・保存・プロフィール導線 */
export const QuizOutroSlide: React.FC<QuizOutroSlideProps> = ({ spec }) => (
  <IgSeriesFrame series={SERIES} tag="都道府県クイズ" sourceLabel={spec.sourceLabel}>
    <div style={{ marginTop: 140 }}>
      <h1
        style={{
          ...IG_HEADLINE_STYLE,
          fontSize: 84,
          lineHeight: 1.4,
        }}
      >
        あなたの県は
        <br />
        何位でしたか？
      </h1>
      <p style={{ fontSize: 36, fontWeight: IG_FONT.weight.bold, marginTop: 32, lineHeight: 1.5 }}>
        予想が当たった人も外れた人も
        <br />
        コメントで教えてください
      </p>
      <div style={{ marginTop: 60, display: "flex", flexDirection: "column", gap: 22 }}>
        <IgSeriesCard style={{ padding: "28px 36px", fontSize: 34, fontWeight: IG_FONT.weight.bold }}>
          <IgSeriesEmphasis series={SERIES}>保存</IgSeriesEmphasis>して、
          {spec.saveReason ?? "友だちにも出題してみて"}
        </IgSeriesCard>
        <IgSeriesCard style={{ padding: "28px 36px", fontSize: 34, fontWeight: IG_FONT.weight.bold }}>
          全47都道府県は<IgSeriesEmphasis series={SERIES}>プロフィールのリンク</IgSeriesEmphasis>から
        </IgSeriesCard>
      </div>
    </div>
  </IgSeriesFrame>
);
