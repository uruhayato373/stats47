import React from "react";

import { IG_FONT, IG_HEADLINE_STYLE, IgSeriesCard, IgSeriesEmphasis, IgSeriesFrame } from "@/features/ig-series";

import type { MapCarouselData } from "./types";

const SERIES = "map" as const;

interface MapOutroSlideProps {
  data: MapCarouselData;
}

/** 4枚目: 保存・プロフィール導線 */
export const MapOutroSlide: React.FC<MapOutroSlideProps> = ({ data }) => (
  <IgSeriesFrame series={SERIES} tag="地図で見る" sourceLabel={data.source}>
    <div style={{ marginTop: 140 }}>
      <h1 style={{ ...IG_HEADLINE_STYLE, fontSize: 80, lineHeight: 1.4 }}>
        あなたの県は
        <br />
        どのあたりでしたか？
      </h1>
      <p style={{ fontSize: 34, fontWeight: IG_FONT.weight.bold, marginTop: 28, lineHeight: 1.5 }}>
        地元の色をコメントで
        <br />
        教えてください
      </p>
      <div style={{ marginTop: 56, display: "flex", flexDirection: "column", gap: 22 }}>
        <IgSeriesCard style={{ padding: "28px 36px", fontSize: 34, fontWeight: IG_FONT.weight.bold }}>
          <IgSeriesEmphasis series={SERIES}>保存</IgSeriesEmphasis>して、{data.label}の地図を見返してね
        </IgSeriesCard>
        <IgSeriesCard style={{ padding: "28px 36px", fontSize: 34, fontWeight: IG_FONT.weight.bold }}>
          全47都道府県は<IgSeriesEmphasis series={SERIES}>プロフィールのリンク</IgSeriesEmphasis>から
        </IgSeriesCard>
      </div>
    </div>
  </IgSeriesFrame>
);
