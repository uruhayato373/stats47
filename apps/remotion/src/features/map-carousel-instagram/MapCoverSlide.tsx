import React from "react";

import { IG_FONT, IG_HEADLINE_STYLE, IgSeriesFrame } from "@/features/ig-series";

import type { MapCarouselData } from "./types";

const SERIES = "map" as const;

interface MapCoverSlideProps {
  data: MapCarouselData;
}

/** 1枚目: 表紙。問いかけ */
export const MapCoverSlide: React.FC<MapCoverSlideProps> = ({ data }) => (
  <IgSeriesFrame series={SERIES} tag="地図で見る" swipeLabel="地図は次へ" sourceLabel={data.source}>
    <div style={{ marginTop: 160, display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ ...IG_HEADLINE_STYLE, fontSize: 74, lineHeight: 1.4 }}>{data.label}</div>
      <p style={{ fontSize: 36, fontWeight: IG_FONT.weight.bold, lineHeight: 1.6 }}>
        47都道府県、値が高いのはどこ？
      </p>
      <p style={{ fontSize: 26, fontWeight: IG_FONT.weight.bold, marginTop: 8, opacity: 0.9 }}>
        {data.year}年・単位: {data.unit}
        {data.scopeNote ? `（${data.scopeNote}）` : ""}
      </p>
    </div>
  </IgSeriesFrame>
);
