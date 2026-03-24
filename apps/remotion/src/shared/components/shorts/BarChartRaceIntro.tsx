import React, { useMemo } from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { scaleSequential } from "d3-scale";
import { interpolateBlues, interpolateYlOrRd, interpolateGreens, interpolatePurples, interpolateOranges } from "d3-scale-chromatic";
import { TILE_GRID_LAYOUT, type TileGridCell } from "@stats47/visualization";
import type { BarChartRaceFrame } from "@stats47/visualization";

import { BRAND, COLOR_SCHEMES, FONT, type ThemeName } from "@/shared";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ColorSchemeName = "Blues" | "YlOrRd" | "Greens" | "Purples" | "Oranges";

const COLOR_SCHEME_INTERPOLATORS: Record<ColorSchemeName, (t: number) => string> = {
  Blues: (t) => interpolateBlues(0.25 + t * 0.75),
  YlOrRd: (t) => interpolateYlOrRd(0.15 + t * 0.85),
  Greens: (t) => interpolateGreens(0.25 + t * 0.75),
  Purples: (t) => interpolatePurples(0.25 + t * 0.75),
  Oranges: (t) => interpolateOranges(0.25 + t * 0.75),
};

export interface BarChartRaceIntroProps {
  frames: BarChartRaceFrame[];
  title: string;
  theme?: ThemeName;
  hookText?: string;
  /** タイルマップのカラースキーム @default "Blues" */
  colorScheme?: ColorSchemeName;
}

// ---------------------------------------------------------------------------
// Layout constants (1080x1920 portrait)
// ---------------------------------------------------------------------------

const REGION_OFFSETS: Record<number, { dx: number; dy: number }> = Object.fromEntries([
  ...[36, 37, 38, 39].map((id) => [id, { dx: 1, dy: 1 }]),
  ...[40, 41, 42, 43, 44, 45, 46, 47].map((id) => [id, { dx: 1, dy: 1 }]),
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
const CELL_SIZE = 1080 / GRID_COLS;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** "東京都" → "東京", "北海道" → "北海道" */
function stripSuffix(name: string): string {
  return name.replace(/(都|府|県)$/, "");
}

function buildValueMap(items: { name: string; value: number }[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const item of items) {
    map.set(stripSuffix(item.name), item.value);
  }
  return map;
}

function buildColorScale(values: number[], schemeName: ColorSchemeName = "Blues") {
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const interpolator = COLOR_SCHEME_INTERPOLATORS[schemeName];
  return scaleSequential(interpolator).domain([minVal, maxVal]);
}

function getContrastTextColor(bgColor: string): string {
  const match = bgColor.match(/\d+/g);
  if (!match || match.length < 3) return "#FFFFFF";
  const [r, g, b] = match.map(Number);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? "#0F172A" : "#FFFFFF";
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

const Tile: React.FC<{
  cell: TileGridCell;
  value: number | undefined;
  scale: number;
  isDark: boolean;
  getColor: (value: number) => string;
}> = ({ cell, value, scale, isDark, getColor }) => {
  const w = (cell.w ?? 1) * CELL_SIZE;
  const h = (cell.h ?? 1) * CELL_SIZE;
  const x = (cell.x - GRID_MIN_X) * CELL_SIZE;
  const y = cell.y * CELL_SIZE;
  const fillColor = value !== undefined ? getColor(value) : (isDark ? "#334155" : "#E2E8F0");
  const textColor = value !== undefined ? getContrastTextColor(fillColor) : (isDark ? "#94A3B8" : "#64748B");
  const nameFontSize = cell.name.length >= 3 ? 18 : 22;

  return (
    <g
      transform={`translate(${x + w / 2}, ${y + h / 2}) scale(${scale})`}
      opacity={scale}
    >
      <rect
        x={-w / 2 + 2}
        y={-h / 2 + 2}
        width={w - 4}
        height={h - 4}
        rx={8}
        ry={8}
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

export const BarChartRaceIntro: React.FC<BarChartRaceIntroProps> = ({
  frames,
  title,
  theme = "dark",
  hookText,
  colorScheme = "Blues",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const colors = COLOR_SCHEMES[theme];
  const isDark = theme === "dark";

  const sprOptions = { fps, damping: 12, mass: 0.8 };
  const brandingSpring = spring({ frame: frame - 3, from: 0, to: 1, ...sprOptions });
  const hookSpring = spring({ frame: frame - 30, from: 0, to: 1, ...sprOptions });

  const phrase1 = hookText ?? "どこが1位？";

  // 最終年のデータでマップを色分け
  const lastFrame = frames[frames.length - 1];
  const valueMap = useMemo(
    () => lastFrame ? buildValueMap(lastFrame.items) : new Map<string, number>(),
    [lastFrame],
  );
  const getColor = useMemo(
    () => lastFrame ? buildColorScale(lastFrame.items.map((i) => i.value), colorScheme) : () => "#334155",
    [lastFrame, colorScheme],
  );

  // ランク順を事前計算（スタガー用）
  const rankMap = useMemo(() => {
    if (!lastFrame) return new Map<string, number>();
    const sorted = [...lastFrame.items].sort((a, b) => b.value - a.value);
    const map = new Map<string, number>();
    sorted.forEach((item, i) => map.set(stripSuffix(item.name), i + 1));
    return map;
  }, [lastFrame]);

  // マップ配置
  const mapScale = 0.85;
  const mapDisplayWidth = GRID_COLS * CELL_SIZE * mapScale;
  const mapDisplayHeight = GRID_ROWS * CELL_SIZE * mapScale;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: colors.background,
        color: colors.foreground,
        fontFamily: FONT.family,
        overflow: "hidden",
      }}
    >
      {/* 背景装飾 */}
      <AbsoluteFill style={{ opacity: 0.15 }}>
        <div style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `linear-gradient(to right, ${colors.muted}44 1px, transparent 1px), linear-gradient(to bottom, ${colors.muted}44 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }} />
      </AbsoluteFill>

      {/* 上部テキスト（コンパクト） */}
      <div
        style={{
          position: "absolute",
          top: 270,
          left: 0,
          right: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 16,
          zIndex: 10,
        }}
      >
        {/* stats47 ブランディング */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          opacity: brandingSpring,
          transform: `translateY(${interpolate(brandingSpring, [0, 1], [-16, 0])}px)`,
        }}>
          <div style={{
            backgroundColor: BRAND.primary,
            color: BRAND.white,
            padding: "6px 18px",
            borderRadius: 8,
            fontSize: 26,
            fontWeight: FONT.weight.black,
            letterSpacing: 1,
          }}>
            stats47
          </div>
          <div style={{
            fontSize: 28,
            fontWeight: FONT.weight.bold,
            color: colors.muted,
            letterSpacing: 2,
          }}>
            統計で見る都道府県
          </div>
        </div>

        {/* 期間バッジ */}
        <div style={{ transform: `scale(${brandingSpring})`, opacity: brandingSpring }}>
          <span style={{
            display: "inline-block",
            backgroundColor: isDark ? "rgba(30, 41, 59, 0.85)" : "rgba(255, 255, 255, 0.9)",
            color: BRAND.secondary,
            border: `2px solid ${BRAND.secondary}`,
            borderRadius: 50,
            padding: "6px 24px",
            fontSize: 36,
            fontWeight: FONT.weight.bold,
            letterSpacing: "0.1em",
            boxShadow: `0 0 32px ${BRAND.secondary}44`,
            backdropFilter: "blur(10px)",
          }}>
            {frames[0]?.date} 〜 {frames[frames.length - 1]?.date}
          </span>
        </div>

        {/* メインタイトル */}
        {(() => {
          const lines = title.split(" ");
          const maxLineChars = Math.max(...lines.map((s) => s.length));
          const titleFontSize = Math.min(100, Math.floor(940 / maxLineChars));
          return lines.map((line, idx) => {
            const lineSpr = spring({ frame: frame - 10 - idx * 5, from: 0, to: 1, ...sprOptions });
            return (
              <h1 key={idx} style={{
                fontSize: titleFontSize,
                fontWeight: FONT.weight.black,
                color: colors.foreground,
                margin: 0,
                lineHeight: 1.1,
                textAlign: "center",
                transform: `translateY(${interpolate(lineSpr, [0, 1], [40, 0])}px) scale(${lineSpr})`,
                opacity: lineSpr,
                textShadow: isDark
                  ? "0 8px 30px rgba(0,0,0,0.9)"
                  : "0 4px 16px rgba(0,0,0,0.15)",
              }}>
                {line}
              </h1>
            );
          });
        })()}

        {/* hookText（赤い傾斜帯） */}
        <div style={{
          width: "110%",
          transform: `rotate(-3deg) scaleX(${hookSpring})`,
          backgroundColor: BRAND.danger,
          borderTop: "3px solid #B91C1C",
          borderBottom: "3px solid #B91C1C",
          padding: "16px 0",
          display: "flex",
          justifyContent: "center",
          boxShadow: "0 12px 40px rgba(0,0,0,0.5)",
          zIndex: 20,
        }}>
          <h2 style={{
            color: "white",
            fontSize: 64,
            fontWeight: FONT.weight.black,
            margin: 0,
            letterSpacing: "-0.02em",
            transform: `scale(${hookSpring})`,
            textShadow: "0 3px 8px rgba(0,0,0,0.4)",
          }}>
            {phrase1}
          </h2>
        </div>
      </div>

      {/* タイルグリッドマップ（中央〜下部） */}
      <div
        style={{
          position: "absolute",
          top: 740,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          opacity: interpolate(frame, [5, 25], [0, 1], { extrapolateRight: "clamp" }),
        }}
      >
        <svg
          viewBox={`0 0 ${GRID_COLS * CELL_SIZE} ${GRID_ROWS * CELL_SIZE}`}
          width={mapDisplayWidth}
          height={mapDisplayHeight}
        >
          {VIDEO_TILE_LAYOUT.map((cell) => {
            const value = valueMap.get(cell.name);
            const rank = rankMap.get(cell.name) ?? 47;
            const staggerDelay = (rank - 1) * 0.4;
            const tileSpring = spring({
              frame: frame - staggerDelay,
              from: 0,
              to: 1,
              fps,
              config: { damping: 12, mass: 0.6, stiffness: 120 },
            });

            return (
              <Tile
                key={cell.id}
                cell={cell}
                value={value}
                scale={tileSpring}
                isDark={isDark}
                getColor={getColor}
              />
            );
          })}
        </svg>
      </div>

      {/* マップ下「最後まで見てね」 */}
      <div style={{
        position: "absolute",
        bottom: 80,
        left: 0,
        right: 0,
        display: "flex",
        justifyContent: "center",
        opacity: interpolate(frame, [50, 65], [0, 1], { extrapolateLeft: "clamp" }),
        zIndex: 10,
      }}>
        <div style={{
          fontSize: 36,
          fontWeight: FONT.weight.bold,
          color: colors.muted,
          letterSpacing: "0.08em",
        }}>
          ▶ 最後まで見てね
        </div>
      </div>
    </AbsoluteFill>
  );
};
