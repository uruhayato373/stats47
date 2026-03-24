import React, { useMemo } from "react";
import {
  AbsoluteFill,
  Audio,
  OffthreadVideo,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { TILE_GRID_LAYOUT, type TileGridCell } from "@stats47/visualization";
import { formatValueWithPrecision } from "@stats47/utils";
import { scaleSequential } from "d3-scale";
import * as chromatic from "d3-scale-chromatic";
import { getGesVideoPath } from "@/features/ranking-youtube-ges/get-ges-video-path";
import { NormalIntro } from "./NormalIntro";
import { NormalOutro } from "./NormalOutro";

import {
  BRAND,
  COLOR_SCHEMES,
  FONT,
  RANK_COLORS,
  SafetyZoneOverlay,
  type ColorScheme,
  type ThemeName,
  type RankingEntry,
  type RankingMeta,
} from "@/shared";

// ---------------------------------------------------------------------------
// Constants – 1920 × 1080 横型レイアウト専用
// ---------------------------------------------------------------------------

/** 左パネル幅 (px) */
const LEFT_W = 700;
/** 右パネル幅 (px) */
const RIGHT_W = 1920 - LEFT_W; // 1220
/** ヘッダー高さ */
const HEADER_H = 120;
/** コンテンツ高さ */
const CONTENT_H = 1080 - HEADER_H; // 960

// ---------------------------------------------------------------------------
// Tile Grid – ★横長 (16:9) 用レイアウト★
//
// 縦長ショート用の TileGridMapScene.tsx とは独立したオフセットを定義。
// 地理的な海峡・海域のギャップを維持しつつ、コンパクト化する。
//
// ギャップの保持:
//   ・北海道 ↔ 東北: y=2 の空行を維持（津軽海峡）
//   ・中国 ↔ 四国: y=10 (x:3-4) の空行を維持（瀬戸内海）
//   ・本州 ↔ 九州: 斜め隣接（関門海峡の近さを表現）
//   ・九州 ↔ 沖縄: y=14 の空行を維持（大洋）
//
// オフセット:
//   ・四国 (id:36-39):  dy:-1 → 中国地方との間に1行ギャップ
//   ・九州 (id:40-46):  dy:-1 → 本州との近さを保ちつつコンパクト
//   ・沖縄 (id:47):     dy:-2 → 九州との間に1行ギャップ
//
// 結果: 14列 × 14行 のグリッド（セル約61px）
// ---------------------------------------------------------------------------

/** 横長用オフセットテーブル (元 TILE_GRID_LAYOUT からの差分) */
const HORIZONTAL_OFFSETS: Record<number, { dx: number; dy: number }> =
  Object.fromEntries([
    // 北海道 (id:1): オフセットなし → y:0-1
    // 東北〜中国 (id:2〜35): オフセットなし → 北海道との自然なギャップ (y:2) を維持
    // 四国 (id:36〜39): オフセットなし → 元の位置を維持（中国地方と2行ギャップ）
    ...[36, 37, 38, 39].map((id) => [id, { dx: 0, dy: 0 }]),
    // 九州 (id:40〜46): 1マス左・2段上へ → 山口のすぐ左下に位置
    ...[40, 41, 42, 43, 44, 45, 46].map((id) => [id, { dx: -1, dy: -2 }]),
    // 沖縄 (id:47): 3段上・1マス左へ → 九州との間に1行ギャップ確保
    [47, { dx: -1, dy: -3 }],
  ]);

const VIDEO_TILE_LAYOUT = TILE_GRID_LAYOUT.map((cell) => {
  const offset = HORIZONTAL_OFFSETS[cell.id];
  if (!offset) return cell;
  return { ...cell, x: cell.x + offset.dx, y: cell.y + offset.dy };
});

const GRID_MIN_X = Math.min(...VIDEO_TILE_LAYOUT.map((c) => c.x));
const GRID_MAX_X = Math.max(
  ...VIDEO_TILE_LAYOUT.map((c) => c.x + (c.w ?? 1))
);
const GRID_MAX_Y = Math.max(
  ...VIDEO_TILE_LAYOUT.map((c) => c.y + (c.h ?? 1))
);
const GRID_COLS = GRID_MAX_X - GRID_MIN_X;
const GRID_ROWS = GRID_MAX_Y;

// 右パネルに収まるようセルサイズを算出（パディング含む）
const MAP_PAD = 20;
const CELL_SIZE_X = (RIGHT_W - MAP_PAD * 2) / GRID_COLS;
const CELL_SIZE_Y = (CONTENT_H - MAP_PAD * 2) / GRID_ROWS;
const CELL_SIZE = Math.min(CELL_SIZE_X, CELL_SIZE_Y);

const MAP_W = GRID_COLS * CELL_SIZE;
const MAP_H = GRID_ROWS * CELL_SIZE;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function normalizePrefId(code: string | number): string {
  const s = String(code).replace(/0{3}$/, "");
  return s.padStart(2, "0");
}

function buildEntryMap(
  entries: RankingEntry[]
): Map<string, RankingEntry> {
  const map = new Map<string, RankingEntry>();
  for (const e of entries) {
    map.set(normalizePrefId(e.areaCode), e);
  }
  return map;
}

function getInterpolator(name: string): (t: number) => string {
  const fn = (chromatic as Record<string, unknown>)[name];
  if (typeof fn === "function") return fn as (t: number) => string;
  return chromatic.interpolateBlues;
}

function buildColorScale(entries: RankingEntry[], scheme = "interpolateBlues") {
  const values = entries.map((e) => e.value);
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const interpolator = getInterpolator(scheme);
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
// Sub-components
// ---------------------------------------------------------------------------

/** 右パネルのタイル 1 つ */
const Tile: React.FC<{
  cell: TileGridCell;
  entry: RankingEntry | undefined;
  scale: number;
  opacity: number;
  isDark: boolean;
  getColor: (v: number) => string;
}> = ({ cell, entry, scale, opacity, isDark, getColor }) => {
  const w = (cell.w ?? 1) * CELL_SIZE;
  const h = (cell.h ?? 1) * CELL_SIZE;
  const x = (cell.x - GRID_MIN_X) * CELL_SIZE;
  const y = cell.y * CELL_SIZE;
  const fillColor = entry
    ? getColor(entry.value)
    : isDark
      ? "#334155"
      : "#E2E8F0";
  const textColor = entry
    ? getContrastTextColor(fillColor)
    : isDark
      ? "#94A3B8"
      : "#64748B";
  const nameLen = cell.name.length;
  const nameFontSize = nameLen >= 3 ? Math.floor(CELL_SIZE * 0.22) : Math.floor(CELL_SIZE * 0.28);
  const opacityValue = entry ? (opacity * 0.85) : (opacity * 0.3);

  return (
    <g
      transform={`translate(${x + w / 2}, ${y + h / 2}) scale(${scale})`}
      opacity={opacityValue}
    >
      <rect
        x={-w / 2 + 1}
        y={-h / 2 + 1}
        width={w - 2}
        height={h - 2}
        rx={4}
        ry={4}
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

/** 左パネル: 順位カード (横型用に新規設計) */
const HorizontalRankCard: React.FC<{
  rank: number;
  areaName: string;
  value: number;
  unit: string;
  precision: number;
  isDark: boolean;
  colors: ColorScheme;
}> = ({ rank, areaName, value, unit, precision, isDark, colors }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const isTop3 = rank <= 3;
  const rankColor = isTop3
    ? RANK_COLORS[rank as 1 | 2 | 3]
    : null;
  const rankAccent = rankColor?.from ?? BRAND.primary;

  const cardSpring = spring({
    frame,
    from: 0,
    to: 1,
    fps,
    config: { damping: 12, mass: 1.2, stiffness: 100 },
  });
  const rankSpring = spring({
    frame: frame - 10,
    from: 0,
    to: 1,
    fps,
    config: { damping: 10, mass: 0.8 },
  });
  const valueSpring = spring({
    frame: frame - 20,
    from: 0,
    to: 1,
    fps,
    config: { damping: 12, mass: 0.5 },
  });
  const rawValue = interpolate(valueSpring, [0, 1], [0, value]);
  const displayText = formatValueWithPrecision(rawValue, precision);

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 20,
        padding: "40px 36px",
        backgroundColor: isDark ? "rgba(15, 23, 42, 0.85)" : "rgba(255, 255, 255, 0.92)",
        borderRadius: 36,
        border: `2px solid ${rank <= 3 ? (RANK_COLORS[rank as 1|2|3]?.from ?? colors.border) : colors.border}`,
        backdropFilter: "blur(20px)",
        boxShadow: isDark
          ? "0 24px 48px rgba(0,0,0,0.5)"
          : "0 24px 48px rgba(0,0,0,0.1)",
        boxSizing: "border-box" as const,
        transform: `translateY(${interpolate(cardSpring, [0, 1], [60, 0])}px)`,
        opacity: cardSpring,
      }}
    >
      {/* 順位表示 */}
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          gap: 8,
        }}
      >
        <span
          style={{
            fontSize: 44,
            fontWeight: FONT.weight.bold,
            color: colors.muted,
          }}
        >
          第
        </span>
        <span
          style={{
            fontSize: 140,
            fontWeight: FONT.weight.black,
            lineHeight: 1,
            transform: `scale(${rankSpring})`,
            background: isTop3
              ? `linear-gradient(to bottom, ${rankColor!.from}, ${rankColor!.to})`
              : colors.foreground,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: isTop3 ? "transparent" : colors.foreground,
            color: isTop3 ? "transparent" : colors.foreground,
          }}
        >
          {rank}
        </span>
        <span
          style={{
            fontSize: 44,
            fontWeight: FONT.weight.bold,
            color: colors.muted,
          }}
        >
          位
        </span>
      </div>

      {/* 都道府県名 */}
      <div
        style={{
          fontSize: 90,
          fontWeight: FONT.weight.black,
          letterSpacing: "-0.02em",
          textAlign: "center",
          opacity: rankSpring,
          transform: `translateY(${interpolate(rankSpring, [0, 1], [20, 0])}px)`,
        }}
      >
        {areaName}
      </div>

      {/* セパレーター */}
      <div
        style={{
          width: "60%",
          height: 3,
          backgroundColor: colors.border,
          borderRadius: 2,
        }}
      />

      {/* 数値表示 */}
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          gap: 12,
        }}
      >
        <span
          style={{
            fontSize: 72,
            fontFamily: "'Inter', sans-serif",
            fontWeight: FONT.weight.black,
            color: rankAccent,
            transform: `scale(${interpolate(valueSpring, [0, 0.9, 1], [1, 1.08, 1])})`,
          }}
        >
          {displayText}
        </span>
        <span
          style={{
            fontSize: 36,
            fontWeight: FONT.weight.bold,
            color: colors.muted,
          }}
        >
          {unit}
        </span>
      </div>

      {/* プログレスバー */}
      <div
        style={{
          width: "80%",
          height: 8,
          backgroundColor: `${colors.muted}33`,
          borderRadius: 4,
          overflow: "hidden",
          marginTop: 12,
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${((47 - rank + 1) / 47) * 100}%`,
            backgroundColor: rankAccent,
            borderRadius: 4,
          }}
        />
      </div>
      <div
        style={{
          fontSize: 22,
          fontWeight: FONT.weight.bold,
          color: colors.muted,
        }}
      >
        {47 - rank + 1} / 47
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// BGM
// ---------------------------------------------------------------------------

const BGM_FILES = [
  "music/bgm.mp3",
  "music/Morning.mp3",
  "music/パステルハウス BGM.mp3",
  "music/野良猫は宇宙を目指した.mp3",
];

/** イントロ・アウトロのフレーム数（各4秒） */
const INTRO_FRAMES = 120;
const OUTRO_FRAMES = 120;

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface RankingNormalProps {
  meta: RankingMeta;
  entries: RankingEntry[];
  theme?: ThemeName;
  showSafeAreas?: boolean;
  /** 1 都道府県あたりの表示フレーム数（デフォルト 4 秒 × fps） */
  framesPerPref?: number;
  /** カラースキーム名 */
  colorScheme?: string;
  /** 小数点以下の桁数 */
  precision?: number;
  /** BGM ファイルパス。省略時は BGM_FILES からタイトルハッシュで選択 */
  musicPath?: string;
  /** イントロ画面のフックテキスト */
  hookText?: string;
  /** 短縮タイトル（サムネイル・イントロで使用） */
  displayTitle?: string;
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export const RankingNormal: React.FC<RankingNormalProps> = ({
  meta,
  entries,
  theme = "dark",
  showSafeAreas = false,
  framesPerPref,
  colorScheme = "interpolateBlues",
  precision = 0,
  musicPath,
  hookText,
  displayTitle,
}) => {
  const { fps } = useVideoConfig();
  const fpPref = framesPerPref ?? fps * 4;
  const colors = COLOR_SCHEMES[theme];
  const isDark = theme === "dark";

  // BGM: 指定があればそれを、なければタイトルからハッシュで決定的に選択
  const bgmPath = useMemo(() => {
    if (musicPath) return musicPath;
    const title = meta.title;
    let hash = 0;
    for (let i = 0; i < title.length; i++) {
      hash = ((hash << 5) - hash + title.charCodeAt(i)) | 0;
    }
    return staticFile(BGM_FILES[Math.abs(hash) % BGM_FILES.length]);
  }, [musicPath, meta.title]);

  // タイムライン
  const mainStart = INTRO_FRAMES;
  const mainDuration = fpPref * entries.length;
  const outroStart = mainStart + mainDuration;

  return (
    <>
      <Audio src={bgmPath} loop />

      {/* イントロ */}
      <Sequence from={0} durationInFrames={INTRO_FRAMES} name="Intro">
        <NormalIntro
          title={meta.title}
          yearName={meta.yearName}
          subtitle={meta.subtitle}
          theme={theme}
          entries={entries}
          colorScheme={colorScheme}
          hookText={hookText}
          displayTitle={displayTitle}
        />
      </Sequence>

      {/* メイン: ランキング本体 */}
      <Sequence from={mainStart} durationInFrames={mainDuration} name="Main">
        <RankingMainBody
          meta={meta}
          entries={entries}
          theme={theme}
          showSafeAreas={showSafeAreas}
          fpPref={fpPref}
          colorScheme={colorScheme}
          precision={precision}
        />
      </Sequence>

      {/* アウトロ */}
      <Sequence from={outroStart} durationInFrames={OUTRO_FRAMES} name="Outro">
        <NormalOutro theme={theme} />
      </Sequence>
    </>
  );
};

// ---------------------------------------------------------------------------
// RankingMainBody – ランキング本体の描画（Sequence 内で使用）
// ---------------------------------------------------------------------------

interface RankingMainBodyProps {
  meta: RankingMeta;
  entries: RankingEntry[];
  theme: ThemeName;
  showSafeAreas: boolean;
  fpPref: number;
  colorScheme: string;
  precision: number;
}

const RankingMainBody: React.FC<RankingMainBodyProps> = ({
  meta,
  entries,
  theme,
  showSafeAreas,
  fpPref,
  colorScheme,
  precision,
}) => {
  const { fps } = useVideoConfig();
  const frame = useCurrentFrame();
  const colors = COLOR_SCHEMES[theme];
  const isDark = theme === "dark";

  // 47 位 → 1 位（降順）
  const sortedEntries = useMemo(
    () => [...entries].sort((a, b) => b.rank - a.rank),
    [entries]
  );

  const entryMap = useMemo(() => buildEntryMap(entries), [entries]);
  const getColor = useMemo(
    () => buildColorScale(entries, colorScheme),
    [entries, colorScheme]
  );

  // 現在どの都道府県を表示中か
  const currentIndex = Math.min(
    Math.floor(frame / fpPref),
    sortedEntries.length - 1
  );

  // 表示済み都道府県コード
  const revealedCodes = useMemo(() => {
    const s = new Set<string>();
    for (let i = 0; i <= currentIndex; i++) {
      s.add(normalizePrefId(sortedEntries[i].areaCode));
    }
    return s;
  }, [currentIndex, sortedEntries]);

  const currentEntry = sortedEntries[currentIndex];
  const currentCode = normalizePrefId(currentEntry.areaCode);

  // 現在のタイルのポップインスプリング（バウンシー: TileGridMapScene 準拠）
  const revealFrame = currentIndex * fpPref;
  const localFrame = frame - revealFrame;
  const rawSpring = spring({
    frame: localFrame,
    from: 0,
    to: 1,
    fps,
    config: { damping: 5, mass: 1.5, stiffness: 80 },
  });
  const tileSpring = interpolate(rawSpring, [0, 1], [0, 2], { extrapolateRight: "clamp" });

  // グローリングのアニメーション
  const glowOpacity = interpolate(localFrame, [0, 8, 30, 50], [0, 1, 0.6, 0], { extrapolateRight: "clamp" });
  const glowScale = interpolate(localFrame, [0, 8, 50], [0.5, 1.15, 1.25], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: colors.background,
        color: colors.foreground,
        fontFamily: FONT.family,
        overflow: "hidden",
      }}
    >
      {/* 背景グリッド */}
      <AbsoluteFill style={{ zIndex: 0 }}>
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: `linear-gradient(to right, ${colors.muted}15 1px, transparent 1px), linear-gradient(to bottom, ${colors.muted}15 1px, transparent 1px)`,
            backgroundSize: "60px 60px",
            opacity: isDark ? 0.3 : 0.5,
          }}
        />
        {/* 光のエフェクト */}
        <div
          style={{
            position: "absolute",
            top: "30%",
            left: "25%",
            width: 600,
            height: 600,
            borderRadius: "50%",
            background: `radial-gradient(circle, ${BRAND.primary}33 0%, transparent 70%)`,
            filter: "blur(100px)",
            opacity: 0.5,
          }}
        />
      </AbsoluteFill>

      {/* ── ヘッダー ── */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: HEADER_H,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 60px",
          zIndex: 100,
        }}
      >
        {/* ブランドロゴ */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
          }}
        >
          <div
            style={{
              backgroundColor: BRAND.primary,
              color: "#FFF",
              padding: "6px 18px",
              borderRadius: 6,
              fontSize: 22,
              fontWeight: FONT.weight.black,
              letterSpacing: 1,
            }}
          >
            stats47
          </div>
          <span
            style={{
              fontSize: 22,
              fontWeight: FONT.weight.bold,
              color: colors.muted,
            }}
          >
            統計で見る都道府県
          </span>
        </div>

        {/* タイトル */}
        <div
          style={{
            fontSize: 44,
            fontWeight: FONT.weight.black,
            color: colors.foreground,
          }}
        >
          {meta.title}
        </div>

        {/* サブタイトル */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          {meta.yearName && (
            <span
              style={{
                fontSize: 24,
                fontWeight: FONT.weight.bold,
                color: BRAND.secondary,
                backgroundColor: isDark
                  ? "rgba(30,41,59,0.8)"
                  : "rgba(255,255,255,0.9)",
                border: `1px solid ${BRAND.secondary}`,
                borderRadius: 50,
                padding: "6px 20px",
              }}
            >
              {meta.yearName}
            </span>
          )}
          {meta.unit && (
            <span
              style={{
                fontSize: 24,
                fontWeight: FONT.weight.bold,
                color: colors.muted,
              }}
            >
              単位: {meta.unit}
            </span>
          )}
        </div>
      </div>

      {/* ── メインコンテンツ ── */}
      <div
        style={{
          position: "absolute",
          top: HEADER_H,
          left: 0,
          right: 0,
          height: CONTENT_H,
          display: "flex",
          zIndex: 10,
        }}
      >
        {/* 左パネル: 順位カード */}
        <div
          style={{
            width: LEFT_W,
            height: CONTENT_H,
            position: "relative",
            borderRight: `1px solid ${colors.border}`,
          }}
        >
          {sortedEntries.map((entry: RankingEntry, index: number) => (
            <Sequence
              key={entry.areaCode}
              from={index * fpPref}
              durationInFrames={fpPref}
              layout="none"
            >
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "30px 40px",
                }}
              >
                <HorizontalRankCard
                  rank={entry.rank}
                  areaName={entry.areaName}
                  value={entry.value}
                  unit={meta.unit}
                  precision={precision}
                  isDark={isDark}
                  colors={colors}
                />
              </div>
            </Sequence>
          ))}
        </div>

        {/* 右パネル: タイルグリッドマップ + 背景 GES 動画 */}
        <div
          style={{
            width: RIGHT_W,
            height: CONTENT_H,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* 背景: GES 動画 */}
          <AbsoluteFill>
            {sortedEntries.map((entry, index) => (
              <Sequence
                key={`bg-${entry.areaCode}`}
                from={index * fpPref}
                durationInFrames={fpPref}
                layout="none"
              >
                <OffthreadVideo
                  src={getGesVideoPath(entry.areaCode, "landscape")}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                  muted
                />
              </Sequence>
            ))}
            {/* ダークオーバーレイ（視認性向上用） */}
            <AbsoluteFill
              style={{
                backgroundColor: "rgba(0, 0, 0, 0.4)",
                zIndex: 1,
              }}
            />
          </AbsoluteFill>

          <svg
            viewBox={`0 0 ${GRID_COLS * CELL_SIZE} ${GRID_ROWS * CELL_SIZE}`}
            width={MAP_W}
            height={MAP_H}
            style={{ position: "relative", zIndex: 10 }}
          >
            <defs>
              <filter
                id="text-shadow-h"
                x="-20%"
                y="-20%"
                width="140%"
                height="140%"
              >
                <feGaussianBlur
                  in="SourceAlpha"
                  stdDeviation={2}
                  result="blur"
                />
                <feOffset dx={0} dy={1} result="offsetBlur" />
                <feFlood floodColor="#000" floodOpacity={0.6} result="color" />
                <feComposite
                  in="color"
                  in2="offsetBlur"
                  operator="in"
                  result="shadow"
                />
                <feMerge>
                  <feMergeNode in="shadow" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <filter id="tile-glow-h" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur in="SourceGraphic" stdDeviation={6} result="glow" />
                <feMerge>
                  <feMergeNode in="glow" />
                  <feMergeNode in="glow" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            {VIDEO_TILE_LAYOUT.map((cell) => {
              const code = normalizePrefId(cell.id);
              const entry = entryMap.get(code);
              const isRevealed = revealedCodes.has(code);
              const isCurrent = code === currentCode;

              if (isCurrent) {
                const w = (cell.w ?? 1) * CELL_SIZE;
                const h = (cell.h ?? 1) * CELL_SIZE;
                const cx = (cell.x - GRID_MIN_X) * CELL_SIZE + w / 2;
                const cy = cell.y * CELL_SIZE + h / 2;
                const accentColor = entry && entry.rank <= 3 ? BRAND.secondary : BRAND.primaryLight;

                return (
                  <React.Fragment key={cell.id}>
                    {/* グローリング */}
                    <rect
                      x={-w / 2 + 2}
                      y={-h / 2 + 2}
                      width={w - 4}
                      height={h - 4}
                      rx={6}
                      ry={6}
                      fill="none"
                      stroke={accentColor}
                      strokeWidth={4}
                      opacity={glowOpacity}
                      filter="url(#tile-glow-h)"
                      transform={`translate(${cx}, ${cy}) scale(${glowScale})`}
                    />
                    {/* タイル本体 */}
                    <Tile
                      cell={cell}
                      entry={entry}
                      scale={tileSpring}
                      opacity={1}
                      isDark={isDark}
                      getColor={getColor}
                    />
                  </React.Fragment>
                );
              }

              if (!isRevealed) {
                // 未出現タイルはグレーで表示
                return (
                  <Tile
                    key={cell.id}
                    cell={cell}
                    entry={undefined}
                    scale={1}
                    opacity={0.4}
                    isDark={isDark}
                    getColor={getColor}
                  />
                );
              }

              // 出現済み
              return (
                <Tile
                  key={cell.id}
                  cell={cell}
                  entry={entry}
                  scale={1}
                  opacity={1}
                  isDark={isDark}
                  getColor={getColor}
                />
              );
            })}
          </svg>
        </div>
      </div>

      {showSafeAreas && <SafetyZoneOverlay />}
    </AbsoluteFill>
  );
};
