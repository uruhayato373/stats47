import React from "react";

import { IG_FONT, IG_NUMBER_STYLE, IgSeriesCard, IgSeriesFrame } from "@/features/ig-series";

import type { CompareCarouselData } from "./types";

const SERIES = "compare" as const;

interface CompareSummarySlideProps {
  data: CompareCarouselData;
}

/** 3枚目: 勝敗まとめ。何項目中どちらが何勝したかをスコアボード形式で見せる */
export const CompareSummarySlide: React.FC<CompareSummarySlideProps> = ({ data }) => {
  const { summary, items } = data;
  return (
    <IgSeriesFrame series={SERIES} tag="対決の結果" swipeLabel="保存はこちら" sourceLabel="出典は各項目に記載">
      <div style={{ marginTop: 120, fontSize: 40, fontWeight: IG_FONT.weight.bold }}>
        {items.length}項目を比較した結果
      </div>
      <IgSeriesCard style={{ marginTop: 36, padding: "44px 32px", display: "flex", alignItems: "center", justifyContent: "space-around" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 30, fontWeight: IG_FONT.weight.black }}>{data.areaAName}</div>
          <div style={{ ...IG_NUMBER_STYLE, fontSize: 120, lineHeight: 1 }}>{summary.aWins}</div>
          <div style={{ fontSize: 24, fontWeight: IG_FONT.weight.bold, color: "#64748B" }}>勝</div>
        </div>
        <div style={{ fontSize: 44, fontWeight: IG_FONT.weight.black, color: "#CBD5E1" }}>-</div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 30, fontWeight: IG_FONT.weight.black }}>{data.areaBName}</div>
          <div style={{ ...IG_NUMBER_STYLE, fontSize: 120, lineHeight: 1 }}>{summary.bWins}</div>
          <div style={{ fontSize: 24, fontWeight: IG_FONT.weight.bold, color: "#64748B" }}>勝</div>
        </div>
      </IgSeriesCard>
      {summary.ties > 0 && (
        <p style={{ fontSize: 26, fontWeight: IG_FONT.weight.bold, marginTop: 24, textAlign: "center" }}>
          引き分け {summary.ties}項目
        </p>
      )}
    </IgSeriesFrame>
  );
};
