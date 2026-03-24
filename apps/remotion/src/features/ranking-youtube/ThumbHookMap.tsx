import React, { useMemo } from "react";
import { AbsoluteFill } from "remotion";
import { scaleSequential } from "d3-scale";
import * as chromatic from "d3-scale-chromatic";
import { TILE_GRID_LAYOUT, type TileGridCell } from "@stats47/visualization";

import { BRAND, COLOR_SCHEMES, FONT, type ThemeName } from "@/shared/themes/brand";
import type { RankingEntry } from "@/shared/types/ranking";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface ThumbHookMapProps {
  /** フックテキスト（大きく表示、15文字以内） */
  hookText: string;
  /** 表示タイトル（中サイズ、20文字以内） */
  title: string;
  /** サブタイトル（年度・属性情報） */
  subtitle?: string;
  /** 47都道府県エントリ */
  entries: RankingEntry[];
  theme?: ThemeName;
}

// ---------------------------------------------------------------------------
// Tile Grid Constants — RankingNormal と同じ横長 (16:9) 用レイアウト
// ---------------------------------------------------------------------------

/**
 * 横長用オフセット (RankingNormal.tsx と同一)
 * 四国: オフセットなし、九州: -1左 -2上、沖縄: -1左 -3上
 * → 14列 × 14行 のコンパクトなグリッド
 */
const REGION_OFFSETS: Record<number, { dx: number; dy: number }> = Object.fromEntries([
  ...[36, 37, 38, 39].map((id) => [id, { dx: 0, dy: 0 }]),
  ...[40, 41, 42, 43, 44, 45, 46].map((id) => [id, { dx: -1, dy: -2 }]),
  [47, { dx: -1, dy: -3 }],
]);

const VIDEO_TILE_LAYOUT = TILE_GRID_LAYOUT.map((cell) => {
  const offset = REGION_OFFSETS[cell.id];
  if (!offset) return cell;
  return { ...cell, x: cell.x + offset.dx, y: cell.y + offset.dy };
});

const GRID_MIN_X = Math.min(...VIDEO_TILE_LAYOUT.map((c) => c.x));
const GRID_MAX_X = Math.max(...VIDEO_TILE_LAYOUT.map((c) => c.x + (c.w ?? 1)));
const GRID_MAX_Y = Math.max(...VIDEO_TILE_LAYOUT.map((c) => c.y + (c.h ?? 1)));
const GRID_COLS = GRID_MAX_X - GRID_MIN_X;
const GRID_ROWS = GRID_MAX_Y;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function normalizePrefId(code: string | number): string {
  const s = String(code).replace(/0{3}$/, "");
  return s.padStart(2, "0");
}

function buildEntryMap(entries: RankingEntry[]): Map<string, RankingEntry> {
  const map = new Map<string, RankingEntry>();
  for (const e of entries) map.set(normalizePrefId(e.areaCode), e);
  return map;
}

function buildColorScale(entries: RankingEntry[], scheme = "interpolateBlues") {
  const values = entries.map((e) => e.value);
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const fn = (chromatic as Record<string, unknown>)[scheme];
  const interpolator = typeof fn === "function" ? (fn as (t: number) => string) : chromatic.interpolateBlues;
  const wrapped = (t: number) => interpolator(0.25 + t * 0.75);
  const colorScale = scaleSequential(wrapped).domain([minVal, maxVal]);
  return (value: number) => colorScale(value);
}

function getContrastTextColor(bgColor: string): string {
  const match = bgColor.match(/\d+/g);
  if (!match || match.length < 3) return "#FFFFFF";
  const [r, g, b] = match.map(Number);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? "#0F172A" : "#FFFFFF";
}

// ---------------------------------------------------------------------------
// Tile Sub-component
// ---------------------------------------------------------------------------

const Tile: React.FC<{
  cell: TileGridCell;
  entry: RankingEntry | undefined;
  cellSize: number;
  gridMinX: number;
  isDark: boolean;
  getColor: (value: number) => string;
}> = ({ cell, entry, cellSize, gridMinX, isDark, getColor }) => {
  const w = (cell.w ?? 1) * cellSize;
  const h = (cell.h ?? 1) * cellSize;
  const x = (cell.x - gridMinX) * cellSize;
  const y = cell.y * cellSize;
  const fillColor = entry ? getColor(entry.value) : (isDark ? "#334155" : "#E2E8F0");
  const textColor = entry ? getContrastTextColor(fillColor) : (isDark ? "#94A3B8" : "#64748B");
  const nameLen = cell.name.length;
  const nameFontSize = nameLen >= 3 ? Math.floor(cellSize * 0.22) : Math.floor(cellSize * 0.28);

  return (
    <g transform={`translate(${x + w / 2}, ${y + h / 2})`}>
      <rect
        x={-w / 2 + 1.5}
        y={-h / 2 + 1.5}
        width={w - 3}
        height={h - 3}
        rx={5}
        ry={5}
        fill={fillColor}
      />
      <text
        x={0}
        y={0}
        textAnchor="middle"
        dominantBaseline="central"
        fill={textColor}
        fontSize={nameFontSize}
        fontWeight={700}
        fontFamily={FONT.family}
      >
        {cell.name}
      </text>
    </g>
  );
};

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

/**
 * YouTube サムネイル: フック + タイル地図型 (1280x720, 16:9)
 *
 * 左: hookText（大）+ title（中）+ subtitle（小）
 * 右: タイル地図（全47都道府県、値ベースカラー）
 */
export const ThumbHookMap: React.FC<ThumbHookMapProps> = ({
  hookText,
  title,
  subtitle,
  entries,
  theme = "dark",
}) => {
  const colors = COLOR_SCHEMES[theme];
  const isDark = theme === "dark";
  const entryMap = buildEntryMap(entries);
  const getColor = useMemo(() => buildColorScale(entries), [entries]);

  // タイル地図のサイズ計算（右半分 ~600px × 高さ ~680px に収める）
  const mapPad = 20;
  const maxW = 600 - mapPad * 2;
  const maxH = 720 - mapPad * 2;
  const cellSize = Math.min(maxW / GRID_COLS, maxH / GRID_ROWS);
  const svgWidth = GRID_COLS * cellSize;
  const svgHeight = GRID_ROWS * cellSize;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: colors.background,
        color: colors.foreground,
        fontFamily: FONT.family,
        display: "flex",
        overflow: "hidden",
      }}
    >
      {/* 背景装飾 */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `linear-gradient(to right, ${colors.muted}18 1px, transparent 1px), linear-gradient(to bottom, ${colors.muted}18 1px, transparent 1px)`,
          backgroundSize: "40px 40px",
          opacity: 0.4,
        }}
      />
      <div
        style={{
          position: "absolute",
          top: "30%",
          right: "20%",
          width: 500,
          height: 500,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${BRAND.primary}33 0%, transparent 70%)`,
          filter: "blur(80px)",
          opacity: 0.5,
        }}
      />

      {/* 左: テキスト */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: 680,
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "48px 48px 48px 56px",
          zIndex: 10,
        }}
      >
        {/* stats47 バッジ */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 24,
          }}
        >
          <div
            style={{
              backgroundColor: BRAND.primary,
              color: "#FFFFFF",
              padding: "4px 14px",
              borderRadius: 6,
              fontSize: 16,
              fontWeight: FONT.weight.black,
              letterSpacing: 0.5,
            }}
          >
            stats47
          </div>
          <span
            style={{
              fontSize: 15,
              fontWeight: FONT.weight.bold,
              color: colors.muted,
              letterSpacing: 1,
            }}
          >
            統計で見る都道府県
          </span>
        </div>

        {/* hookText — メインの大きな文字 */}
        <div
          style={{
            fontSize: 56,
            fontWeight: FONT.weight.black,
            lineHeight: 1.2,
            color: colors.foreground,
            marginBottom: 16,
            textShadow: isDark
              ? "0 4px 16px rgba(0,0,0,0.6)"
              : "0 2px 8px rgba(0,0,0,0.1)",
          }}
        >
          {hookText}
        </div>

        {/* displayTitle */}
        <div
          style={{
            fontSize: 28,
            fontWeight: FONT.weight.bold,
            color: colors.muted,
            marginBottom: 12,
          }}
        >
          {title}
        </div>

        {/* サブタイトル（年度バッジ） */}
        {subtitle && (
          <div
            style={{
              display: "inline-flex",
              alignSelf: "flex-start",
              backgroundColor: isDark ? "rgba(30, 41, 59, 0.85)" : "rgba(255, 255, 255, 0.9)",
              color: BRAND.secondary,
              border: `1.5px solid ${BRAND.secondary}`,
              borderRadius: 50,
              padding: "4px 18px",
              fontSize: 15,
              fontWeight: FONT.weight.bold,
              letterSpacing: "0.05em",
            }}
          >
            {subtitle}
          </div>
        )}
      </div>

      {/* 右: タイル地図 */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          right: 20,
          transform: "translateY(-50%)",
          zIndex: 5,
        }}
      >
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          width={svgWidth}
          height={svgHeight}
        >
          {VIDEO_TILE_LAYOUT.map((cell) => {
            const code = normalizePrefId(cell.id);
            const entry = entryMap.get(code);
            return (
              <Tile
                key={cell.id}
                cell={cell}
                entry={entry}
                cellSize={cellSize}
                gridMinX={GRID_MIN_X}
                isDark={isDark}
                getColor={getColor}
              />
            );
          })}
        </svg>
      </div>
    </AbsoluteFill>
  );
};
