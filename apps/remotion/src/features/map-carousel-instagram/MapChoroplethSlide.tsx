import React from "react";

import { to2DigitPrefCode } from "@stats47/area";
import { prefectureShortName } from "@stats47/area/short-name";

import { prefectureEntries, renderTileMapBody } from "@/features/data-cards/all47-svg";
import { IMAGE_TILE_LAYOUT } from "@/features/data-cards/tile-layout";

import { IG_FONT, IG_SERIES, IgSeriesCard, IgSeriesFrame } from "@/features/ig-series";

import type { MapCarouselData } from "./types";

const SERIES = "map" as const;
const CELL = 46;
/**
 * 地図カード下端とフレーム下端の間隔。IgSeriesFrame の swipeLabel (bottom:110・高さ約40px) と
 * ブランド行 (bottom:44) の両方を避ける必要があるため、QuizHintSlide の 90px (swipeLabel 無しの
 * 想定) より大きく取る (2026-09-23 実測: 90px だと凡例の下段テキストが swipeLabel と重なって
 * 判読不能になった)。
 */
const FOOTER_CLEARANCE = 190;
const MAP = { width: IMAGE_TILE_LAYOUT.cols * CELL, height: IMAGE_TILE_LAYOUT.rows * CELL };

const SHORT_NAMES = new Map(prefectureEntries().map((e) => [e.areaCode, prefectureShortName(e.areaName)]));

interface MapChoroplethSlideProps {
  data: MapCarouselData;
}

/** 2枚目: タイル地図を値で塗り分け (凡例・単位・年つき)。区切りは props 側で決定済み */
export const MapChoroplethSlide: React.FC<MapChoroplethSlideProps> = ({ data }) => {
  const tileByCode = new Map(data.tiles.map((t) => [t.prefCode2, t]));
  const palette = IG_SERIES[SERIES];
  // 共通のタイル地図 (data-cards/all47-svg.ts) に、props で決めた区分色と県名を載せる
  const tiles = renderTileMapBody(prefectureEntries(), {
    ...MAP,
    showValues: false,
    tileOverride: (areaCode) => ({
      fill: tileByCode.get(to2DigitPrefCode(areaCode))?.fill ?? "#F1F5F9",
      lines: [SHORT_NAMES.get(areaCode) ?? ""],
    }),
  }).svg;

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
          <svg
            viewBox={`0 0 ${MAP.width} ${MAP.height}`}
            style={{ width: "100%", height: "100%" }}
            dangerouslySetInnerHTML={{ __html: tiles }}
          />
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
