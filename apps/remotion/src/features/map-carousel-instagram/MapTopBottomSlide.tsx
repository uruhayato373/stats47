import React from "react";

import { formatValueWithPrecision } from "@stats47/utils";

import { IG_FONT, IgSeriesCard, IgSeriesFrame } from "@/features/ig-series";

import type { MapCarouselData, MapTopBottomEntry } from "./types";

const SERIES = "map" as const;

interface MapTopBottomSlideProps {
  data: MapCarouselData;
}

function EntryRow({ entry, unit, precision, accent }: { entry: MapTopBottomEntry; unit: string; precision: number; accent: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
      <span style={{ width: 46, fontSize: 26, fontWeight: IG_FONT.weight.black, color: accent }}>{entry.rank}</span>
      <span style={{ flex: 1, fontSize: 24, fontWeight: IG_FONT.weight.black }}>{entry.areaName}</span>
      <span style={{ fontSize: 24, fontWeight: IG_FONT.weight.black }}>
        {formatValueWithPrecision(entry.value, precision)}
        {unit}
      </span>
    </div>
  );
}

/** 3枚目: 上位5・下位5 */
export const MapTopBottomSlide: React.FC<MapTopBottomSlideProps> = ({ data }) => (
  <IgSeriesFrame series={SERIES} tag={data.label} swipeLabel="保存はこちら" sourceLabel={data.source}>
    <div style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 18 }}>
      <IgSeriesCard style={{ padding: "22px 28px" }}>
        <div style={{ fontSize: 24, fontWeight: IG_FONT.weight.black, marginBottom: 14, color: "#B45309" }}>上位5</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {data.top5.map((entry) => (
            <EntryRow key={entry.prefCode2} entry={entry} unit={data.unit} precision={data.precision} accent="#B45309" />
          ))}
        </div>
      </IgSeriesCard>
      <IgSeriesCard style={{ padding: "22px 28px" }}>
        <div style={{ fontSize: 24, fontWeight: IG_FONT.weight.black, marginBottom: 14, color: "#475569" }}>下位5</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {data.bottom5.map((entry) => (
            <EntryRow key={entry.prefCode2} entry={entry} unit={data.unit} precision={data.precision} accent="#475569" />
          ))}
        </div>
      </IgSeriesCard>
    </div>
  </IgSeriesFrame>
);
