import React from "react";

import { formatValueWithPrecision } from "@stats47/utils";

import { IG_FONT, IgSeriesCard, IgSeriesEmphasis, IgSeriesFrame } from "@/features/ig-series";

import type { CompareCarouselData, CompareDuelItem } from "./types";

const SERIES = "compare" as const;

interface CompareDuelSlideProps {
  data: CompareCarouselData;
}

function SideValue({
  value,
  unit,
  rank,
  precision,
  isWinner,
}: {
  value: number;
  unit: string;
  rank: number;
  precision: number;
  isWinner: boolean;
}) {
  const formatted = `${formatValueWithPrecision(value, precision)}${unit}`;
  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: 30, fontWeight: IG_FONT.weight.black, lineHeight: 1.2 }}>
        {isWinner ? (
          <IgSeriesEmphasis series={SERIES}>{formatted}</IgSeriesEmphasis>
        ) : (
          formatted
        )}
      </div>
      <div style={{ fontSize: 18, color: "#94A3B8", fontWeight: IG_FONT.weight.bold }}>全国{rank}位</div>
    </div>
  );
}

function DuelRow({ item }: { item: CompareDuelItem }) {
  return (
    <div style={{ borderTop: "2px solid #E2E8F0", paddingTop: 14, paddingBottom: 4 }}>
      <div style={{ fontSize: 24, fontWeight: IG_FONT.weight.black, lineHeight: 1.3 }}>{item.label}</div>
      <div style={{ display: "flex", gap: 18, marginTop: 8, alignItems: "flex-start" }}>
        <SideValue value={item.a.value} unit={item.unit} rank={item.a.rank} precision={item.precision} isWinner={item.winner === "a"} />
        <SideValue value={item.b.value} unit={item.unit} rank={item.b.rank} precision={item.precision} isWinner={item.winner === "b"} />
      </div>
      <div style={{ fontSize: 16, color: "#94A3B8", marginTop: 6 }}>
        出典: {item.source}（{item.year}年）{item.scopeNote ? `・${item.scopeNote}` : ""}
      </div>
    </div>
  );
}

/** 2枚目: 指標ごとの対決。値・単位・順位・年・出典を1件ずつ表示し、勝った方を強調する */
export const CompareDuelSlide: React.FC<CompareDuelSlideProps> = ({ data }) => (
  <IgSeriesFrame series={SERIES} tag="全項目対決" swipeLabel="勝敗まとめは次へ" sourceLabel="出典は各項目に記載">
    <IgSeriesCard style={{ marginTop: 28, marginBottom: 24, padding: "8px 30px 16px", display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 14, fontSize: 22, fontWeight: IG_FONT.weight.black, color: "#64748B" }}>
        <span>{data.areaAName}</span>
        <span>{data.areaBName}</span>
      </div>
      {data.items.map((item) => (
        <DuelRow key={item.rankingKey} item={item} />
      ))}
    </IgSeriesCard>
  </IgSeriesFrame>
);
