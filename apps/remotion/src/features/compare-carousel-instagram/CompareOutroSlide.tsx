import React from "react";

import { IG_FONT, IG_HEADLINE_STYLE, IgSeriesCard, IgSeriesEmphasis, IgSeriesFrame } from "@/features/ig-series";

import type { CompareCarouselData } from "./types";

const SERIES = "compare" as const;

interface CompareOutroSlideProps {
  data: CompareCarouselData;
}

/** 4枚目: 保存・プロフィール導線 */
export const CompareOutroSlide: React.FC<CompareOutroSlideProps> = ({ data }) => (
  <IgSeriesFrame series={SERIES} tag="県どうしの比較" sourceLabel="出典は各項目に記載">
    <div style={{ marginTop: 140 }}>
      <h1 style={{ ...IG_HEADLINE_STYLE, fontSize: 76, lineHeight: 1.4 }}>
        あなたの地元の
        <br />
        数字は？
      </h1>
      <p style={{ fontSize: 34, fontWeight: IG_FONT.weight.bold, marginTop: 28, lineHeight: 1.5 }}>
        {data.areaAName}と{data.areaBName}、
        <br />
        意外な結果はコメントで教えてください
      </p>
      <div style={{ marginTop: 56, display: "flex", flexDirection: "column", gap: 22 }}>
        <IgSeriesCard style={{ padding: "28px 36px", fontSize: 34, fontWeight: IG_FONT.weight.bold }}>
          <IgSeriesEmphasis series={SERIES}>保存</IgSeriesEmphasis>して、自分の地元と比べてみて
        </IgSeriesCard>
        <IgSeriesCard style={{ padding: "28px 36px", fontSize: 34, fontWeight: IG_FONT.weight.bold }}>
          全47都道府県は<IgSeriesEmphasis series={SERIES}>プロフィールのリンク</IgSeriesEmphasis>から
        </IgSeriesCard>
      </div>
    </div>
  </IgSeriesFrame>
);
