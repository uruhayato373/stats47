import React, { useMemo } from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { TILE_GRID_LAYOUT } from "@stats47/visualization";
import { scaleSequential } from "d3-scale";
import { interpolateBlues } from "d3-scale-chromatic";

import { BRAND, COLOR_SCHEMES, FONT, type RankingEntry, type ThemeName } from "@/shared";

// ---------------------------------------------------------------------------
// Tile grid layout for 16:9 intro
// ---------------------------------------------------------------------------

const INTRO_OFFSETS: Record<number, { dx: number; dy: number }> = Object.fromEntries([
  ...[36, 37, 38, 39].map((id) => [id, { dx: 0, dy: 0 }]),
  ...[40, 41, 42, 43, 44, 45, 46].map((id) => [id, { dx: -1, dy: -2 }]),
  [47, { dx: -1, dy: -3 }],
]);

const INTRO_TILE_LAYOUT = TILE_GRID_LAYOUT.map((cell) => {
  const offset = INTRO_OFFSETS[cell.id];
  if (!offset) return cell;
  return { ...cell, x: cell.x + offset.dx, y: cell.y + offset.dy };
});

const GRID_MIN_X = Math.min(...INTRO_TILE_LAYOUT.map((c) => c.x));
const GRID_MAX_X = Math.max(...INTRO_TILE_LAYOUT.map((c) => c.x + (c.w ?? 1)));
const GRID_MAX_Y = Math.max(...INTRO_TILE_LAYOUT.map((c) => c.y + (c.h ?? 1)));
const GRID_COLS = GRID_MAX_X - GRID_MIN_X;
const GRID_ROWS = GRID_MAX_Y;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function normalizePrefId(code: string | number): string {
  const s = String(code).replace(/0{3}$/, "");
  return s.padStart(2, "0");
}

function getContrastTextColor(bgColor: string): string {
  const match = bgColor.match(/\d+/g);
  if (!match || match.length < 3) return "#FFFFFF";
  const [r, g, b] = match.map(Number);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? "#0F172A" : "#FFFFFF";
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface NormalIntroProps {
  title: string;
  yearName?: string;
  subtitle?: string;
  theme?: ThemeName;
  entries?: RankingEntry[];
  colorScheme?: string;
  hookText?: string;
  /** サムネイルと統一する短縮タイトル（hookText 使用時のサブタイトル） */
  displayTitle?: string;
}

/**
 * YouTube 通常動画 (16:9) 用イントロ画面
 *
 * 左: ブランドロゴ + 動画タイトル + 年度バッジ
 * 右: タイルグリッドマップ（データ色分け）
 * 4秒（120フレーム）を想定。
 */
export const NormalIntro: React.FC<NormalIntroProps> = ({
  title,
  yearName,
  subtitle,
  theme = "dark",
  entries = [],
  colorScheme,
  hookText,
  displayTitle,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const colors = COLOR_SCHEMES[theme];
  const isDark = theme === "dark";

  const sprConfig = { fps, damping: 12, mass: 0.8 };

  // アニメーション
  const brandSpring = spring({ frame: frame - 5, from: 0, to: 1, ...sprConfig });
  const subtitleSpring = spring({ frame: frame - 15, from: 0, to: 1, ...sprConfig });
  const badgeSpring = spring({ frame: frame - 25, from: 0, to: 1, ...sprConfig });
  const hookSpring = spring({ frame: frame - 36, from: 0, to: 1, fps, config: { damping: 12, mass: 0.5 } });
  const lineSpring = spring({ frame: frame - 18, from: 0, to: 1, fps, config: { damping: 20, mass: 1 } });
  const mapSpring = spring({ frame: frame - 8, from: 0, to: 1, fps, config: { damping: 16, mass: 1 } });

  // hookText があればそれをメインタイトルに、なければ title を使用
  const mainTitle = hookText || title;
  const lines = mainTitle.split(" ");
  const maxLineChars = Math.max(...lines.map((s) => s.length));
  const titleFontSize = Math.min(100, Math.floor(1200 / maxLineChars));

  // フェードアウト（最後の0.5秒）
  const fadeOut = interpolate(frame, [105, 120], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // タイルマップの色分け
  const entryMap = useMemo(() => {
    const m = new Map<string, RankingEntry>();
    for (const e of entries) m.set(normalizePrefId(e.areaCode), e);
    return m;
  }, [entries]);

  const getColor = useMemo(() => {
    if (entries.length === 0) return () => (isDark ? "#334155" : "#E2E8F0");
    const values = entries.map((e) => e.value);
    const minVal = Math.min(...values);
    const maxVal = Math.max(...values);
    const wrapped = (t: number) => interpolateBlues(0.25 + t * 0.75);
    const scale = scaleSequential(wrapped).domain([minVal, maxVal]);
    return (v: number) => scale(v);
  }, [entries, isDark]);

  // マップサイズ
  const cellSize = 56;
  const mapW = GRID_COLS * cellSize;
  const mapH = GRID_ROWS * cellSize;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: colors.background,
        color: colors.foreground,
        fontFamily: FONT.family,
        overflow: "hidden",
        opacity: fadeOut,
      }}
    >
      {/* 背景装飾 */}
      <AbsoluteFill style={{ opacity: 0.15 }}>
        <div style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `linear-gradient(to right, ${colors.muted}33 1px, transparent 1px), linear-gradient(to bottom, ${colors.muted}33 1px, transparent 1px)`,
          backgroundSize: "80px 80px",
        }} />
      </AbsoluteFill>

      {/* 光のエフェクト */}
      <div style={{
        position: "absolute",
        top: "40%",
        left: "30%",
        width: 800,
        height: 600,
        borderRadius: "50%",
        background: `radial-gradient(circle, ${BRAND.primary}33 0%, transparent 70%)`,
        transform: "translate(-50%, -50%)",
        filter: "blur(120px)",
        opacity: 0.5,
      }} />

      {/* 右: タイルグリッドマップ */}
      <div
        style={{
          position: "absolute",
          right: 100,
          top: "50%",
          transform: `translateY(-50%) scale(${interpolate(mapSpring, [0, 1], [0.85, 1])})`,
          opacity: mapSpring,
        }}
      >
        <svg width={mapW} height={mapH} viewBox={`0 0 ${mapW} ${mapH}`}>
          {INTRO_TILE_LAYOUT.map((cell, idx) => {
            const tileSpr = spring({
              frame: frame - 5 - idx * 0.6,
              from: 0,
              to: 1,
              fps,
              config: { damping: 12, mass: 0.4 },
            });
            const code = normalizePrefId(cell.id);
            const entry = entryMap.get(code);
            const w = (cell.w ?? 1) * cellSize;
            const h = (cell.h ?? 1) * cellSize;
            const tx = (cell.x - GRID_MIN_X) * cellSize;
            const ty = cell.y * cellSize;
            const fillColor = entry ? getColor(entry.value) : (isDark ? "#334155" : "#E2E8F0");
            const textColor = entry ? getContrastTextColor(fillColor) : (isDark ? "#94A3B8" : "#64748B");
            const nameFontSize = cell.name.length >= 3 ? 13 : 16;

            return (
              <g key={cell.id} opacity={tileSpr} transform={`translate(${tx}, ${ty})`}>
                <rect
                  width={w - 2}
                  height={h - 2}
                  x={1}
                  y={1}
                  rx={6}
                  fill={fillColor}
                  stroke={isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)"}
                  strokeWidth={1}
                />
                <text
                  x={w / 2}
                  y={h / 2}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill={textColor}
                  fontSize={nameFontSize}
                  fontWeight={700}
                  fontFamily={FONT.family}
                  opacity={0.95}
                >
                  {cell.name}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* 左: テキストコンテンツ */}
      <div
        style={{
          position: "absolute",
          left: 80,
          top: 0,
          bottom: 0,
          width: 900,
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "center",
          gap: 24,
        }}
      >
        {/* stats47 ブランドバッジ */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          opacity: brandSpring,
          transform: `translateY(${interpolate(brandSpring, [0, 1], [-20, 0])}px)`,
        }}>
          <div style={{
            backgroundColor: BRAND.primary,
            color: BRAND.white,
            padding: "10px 28px",
            borderRadius: 8,
            fontSize: 32,
            fontWeight: FONT.weight.black,
            letterSpacing: 1,
          }}>
            stats47
          </div>
          <div style={{
            fontSize: 30,
            fontWeight: FONT.weight.bold,
            color: colors.muted,
          }}>
            統計で見る都道府県
          </div>
        </div>

        {/* メインタイトル */}
        {lines.map((line, idx) => {
          const lineSpr = spring({ frame: frame - 12 - idx * 5, from: 0, to: 1, ...sprConfig });
          return (
            <div key={idx} style={{
              fontSize: titleFontSize,
              fontWeight: FONT.weight.black,
              lineHeight: 1.15,
              color: colors.foreground,
              transform: `translateY(${interpolate(lineSpr, [0, 1], [30, 0])}px)`,
              opacity: lineSpr,
              textShadow: isDark
                ? "0 6px 24px rgba(0,0,0,0.8)"
                : "0 4px 12px rgba(0,0,0,0.1)",
            }}>
              {line}
            </div>
          );
        })}

        {/* アンダーライン */}
        <div style={{
          width: interpolate(lineSpring, [0, 1], [0, 560]),
          height: 4,
          backgroundColor: BRAND.primary,
          borderRadius: 2,
        }} />

        {/* サブタイトル: hookText 使用時は displayTitle、通常は subtitle */}
        <div style={{
          fontSize: hookText ? 44 : 36,
          fontWeight: FONT.weight.bold,
          color: colors.muted,
          letterSpacing: "0.1em",
          opacity: subtitleSpring,
          transform: `translateY(${interpolate(subtitleSpring, [0, 1], [15, 0])}px)`,
        }}>
          {hookText ? (displayTitle || title) : (subtitle || "都道府県ランキング")}
        </div>

        {/* 年度バッジ */}
        {yearName && (
          <div style={{
            marginTop: 8,
            opacity: badgeSpring,
            transform: `scale(${badgeSpring})`,
          }}>
            <span style={{
              backgroundColor: isDark ? "rgba(30, 41, 59, 0.85)" : "rgba(255, 255, 255, 0.9)",
              color: BRAND.secondary,
              border: `2px solid ${BRAND.secondary}`,
              borderRadius: 50,
              padding: "8px 28px",
              fontSize: 30,
              fontWeight: FONT.weight.bold,
              letterSpacing: "0.1em",
              backdropFilter: "blur(10px)",
            }}>
              {yearName}
            </span>
          </div>
        )}

        {/* 下部テキスト */}
        <div style={{
          marginTop: 24,
          fontSize: 32,
          fontWeight: FONT.weight.bold,
          color: colors.muted,
          letterSpacing: "0.1em",
          opacity: interpolate(frame, [60, 80], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
        }}>
          ▶ 47位からカウントダウン！
        </div>
      </div>
    </AbsoluteFill>
  );
};
