import React from "react";

import { IG_FONT, IG_HEADLINE_STYLE, IgSeriesFrame } from "@/features/ig-series";

import type { CompareCarouselData } from "./types";

const SERIES = "compare" as const;

interface CompareCoverSlideProps {
  data: CompareCarouselData;
}

/** 1枚目: 表紙。2県名と問いかけ */
export const CompareCoverSlide: React.FC<CompareCoverSlideProps> = ({ data }) => (
  <IgSeriesFrame
    series={SERIES}
    tag="県どうしの比較"
    swipeLabel="比較は次へ"
    sourceLabel="出典は各項目に記載"
  >
    <div style={{ marginTop: 150, display: "flex", flexDirection: "column", gap: 28 }}>
      <div style={{ ...IG_HEADLINE_STYLE, fontSize: 78, lineHeight: 1.35 }}>{data.areaAName}</div>
      <div style={{ fontSize: 44, fontWeight: IG_FONT.weight.black, opacity: 0.85 }}>VS</div>
      <div style={{ ...IG_HEADLINE_STYLE, fontSize: 78, lineHeight: 1.35 }}>{data.areaBName}</div>
      <p style={{ fontSize: 34, fontWeight: IG_FONT.weight.bold, marginTop: 20, lineHeight: 1.6, whiteSpace: "pre-line" }}>
        暮らしの数字、大きいのはどっち？
      </p>
    </div>
  </IgSeriesFrame>
);
