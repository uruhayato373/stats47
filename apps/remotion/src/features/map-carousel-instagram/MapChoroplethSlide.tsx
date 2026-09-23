import React from "react";

import { TILE_GRID_LAYOUT } from "@stats47/visualization";

import { IG_FONT, IG_SERIES, IgSeriesCard, IgSeriesFrame } from "@/features/ig-series";

import type { MapCarouselData } from "./types";

const SERIES = "map" as const;
const CELL = 46;
const GAP = 5;
/**
 * 地図カード下端とフレーム下端の間隔。IgSeriesFrame の swipeLabel (bottom:110・高さ約40px) と
 * ブランド行 (bottom:44) の両方を避ける必要があるため、QuizHintSlide の 90px (swipeLabel 無しの
 * 想定) より大きく取る (2026-09-23 実測: 90px だと凡例の下段テキストが swipeLabel と重なって
 * 判読不能になった)。
 */
const FOOTER_CLEARANCE = 190;
const minX = Math.min(...TILE_GRID_LAYOUT.map((c) => c.x));
const maxX = Math.max(...TILE_GRID_LAYOUT.map((c) => c.x + (c.w ?? 1)));
const maxY = Math.max(...TILE_GRID_LAYOUT.map((c) => c.y + (c.h ?? 1)));

interface MapChoroplethSlideProps {
  data: MapCarouselData;
}

/** "01".."47" → TILE_GRID_LAYOUT の id (number) と対応させるための正規化 */
function tilePrefCode(id: number): string {
  return String(id).padStart(2, "0");
}

/** 2枚目: タイル地図を値で塗り分け (凡例・単位・年つき)。区切りは props 側で決定済み */
export const MapChoroplethSlide: React.FC<MapChoroplethSlideProps> = ({ data }) => {
  const tileByCode = new Map(data.tiles.map((t) => [t.prefCode2, t]));
  const palette = IG_SERIES[SERIES];

  return (
    <IgSeriesFrame series={SERIES} tag={data.label} swipeLabel="上位・下位は次へ" sourceLabel={data.source}>
      <p style={{ fontSize: 24, fontWeight: IG_FONT.weight.bold, marginTop: 18, color: palette.inkSmall }}>
        {data.year}年・単位: {data.unit}
      </p>
      <IgSeriesCard
        style={{
          flex: 1,
          minHeight: 0,
          marginTop: 14,
          marginBottom: FOOTER_CLEARANCE,
          padding: "16px 16px 12px",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div style={{ flex: 1, minHeight: 0 }}>
          <svg viewBox={`0 0 ${(maxX - minX) * CELL} ${maxY * CELL}`} style={{ width: "100%", height: "100%" }}>
            {TILE_GRID_LAYOUT.map((cell) => {
              const code = tilePrefCode(cell.id);
              const tile = tileByCode.get(code);
              const w = (cell.w ?? 1) * CELL - GAP;
              const h = (cell.h ?? 1) * CELL - GAP;
              const x = (cell.x - minX) * CELL;
              const y = cell.y * CELL;
              const fill = tile?.fill ?? "#F1F5F9";
              const textColor = tile?.textColor ?? "#475569";
              return (
                <g key={cell.id}>
                  <rect x={x} y={y} width={w} height={h} rx={8} fill={fill} />
                  <text
                    x={x + w / 2}
                    y={y + h / 2}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontFamily={IG_FONT.body}
                    fontSize={14}
                    fontWeight={600}
                    fill={textColor}
                  >
                    {cell.name}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 6, paddingTop: 12 }}>
          {data.legend.map((entry) => (
            <div key={entry.bin} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, flex: 1, minWidth: 0 }}>
              <div style={{ width: "100%", height: 16, borderRadius: 4, backgroundColor: entry.fill, border: "1px solid #E2E8F0" }} />
              <div style={{ fontSize: 13, fontWeight: IG_FONT.weight.bold, color: "#475569", textAlign: "center", lineHeight: 1.3 }}>
                {entry.rangeLabel}
              </div>
              <div style={{ fontSize: 12, color: "#94A3B8" }}>{entry.count}県</div>
            </div>
          ))}
        </div>
      </IgSeriesCard>
    </IgSeriesFrame>
  );
};
