import React, { useMemo } from "react";
import { AbsoluteFill, OffthreadVideo, Sequence, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { scaleDiverging, scaleSequential } from "d3-scale";
import * as chromatic from "d3-scale-chromatic";
import { TILE_GRID_LAYOUT, type TileGridCell } from "@stats47/visualization";
import { formatValueWithPrecision } from "@stats47/utils";

import { BRAND, COLOR_SCHEMES, FONT, RADIUS, type ColorScheme, type ThemeName } from "@/shared/themes/brand";
import type { RankingEntry, RankingMeta } from "@/shared/types/ranking";
import { getGesVideoPath } from "@/features/ranking-youtube-ges/get-ges-video-path";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface RevealScheduleItem {
  /** Sequence 内の相対開始フレーム */
  startFrame: number;
  /** 表示持続フレーム数 */
  duration: number;
}

export interface TileGridMapSceneProps {
  entries: RankingEntry[];
  meta: RankingMeta;
  theme?: ThemeName;
  /** "static": 全タイル一括表示, "progressive": 順番に出現 */
  mode?: "static" | "progressive";
  precision?: number;
  /** progressive モード用: 各都道府県の出現スケジュール */
  revealSchedule?: RevealScheduleItem[];
  /** D3 カラースキーム名。デフォルト: "interpolateBlues" */
  colorScheme?: string;
  /** カラースキームの種類 */
  colorSchemeType?: "sequential" | "diverging";
  /** diverging スケールの中間値 */
  divergingMidpointValue?: number;
  /** サムネイル用フックテキスト（static モード限定、地図左上の空白に表示） */
  hookText?: string;
  /** GES背景動画を使用するか */
  gesBackground?: boolean;
  /** 表示用タイトル。指定時は meta.title を上書きする */
  displayTitle?: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/**
 * 動画用レイアウト調整: 九州・四国を +1右 +1下 にずらして
 * グリッドを 13列 × 17行 に圧縮し、セルサイズを拡大する
 */
const REGION_OFFSETS: Record<number, { dx: number; dy: number }> = Object.fromEntries([
  // 四国 (id: 36-39)
  ...[36, 37, 38, 39].map((id) => [id, { dx: 1, dy: 1 }]),
  // 九州・沖縄 (id: 40-47)
  ...[40, 41, 42, 43, 44, 45, 46, 47].map((id) => [id, { dx: 1, dy: 1 }]),
]);

/** オフセット適用済みのレイアウトを構築 */
const VIDEO_TILE_LAYOUT = TILE_GRID_LAYOUT.map((cell) => {
  const offset = REGION_OFFSETS[cell.id];
  if (!offset) return cell;
  return { ...cell, x: cell.x + offset.dx, y: cell.y + offset.dy };
});

// オフセット適用後の実際の使用範囲からグリッドサイズを算出
const GRID_MIN_X = Math.min(...VIDEO_TILE_LAYOUT.map((c) => c.x));
const GRID_MAX_X = Math.max(...VIDEO_TILE_LAYOUT.map((c) => c.x + (c.w ?? 1)));
const GRID_MAX_Y = Math.max(...VIDEO_TILE_LAYOUT.map((c) => c.y + (c.h ?? 1)));
const GRID_COLS = GRID_MAX_X - GRID_MIN_X; // 13列
const GRID_ROWS = GRID_MAX_Y;               // 17行
const CELL_SIZE = 1080 / GRID_COLS;          // ≈83px

/** SNS セーフエリア（RankCard と同じ） */
const SAFE_AREA = {
  top: 180,
  right: 160,
  bottom: 420,
  left: 80,
} as const;

/**
 * 都道府県コードを2桁に正規化
 * "01000" → "01", "13" → "13", 1 → "01"
 */
function normalizePrefId(code: string | number): string {
  const s = String(code).replace(/0{3}$/, "");
  return s.padStart(2, "0");
}

/** areaCode → RankingEntry の Map を構築（2桁正規化キー） */
function buildEntryMap(entries: RankingEntry[]): Map<string, RankingEntry> {
  const map = new Map<string, RankingEntry>();
  for (const e of entries) {
    map.set(normalizePrefId(e.areaCode), e);
  }
  return map;
}

/** D3 の interpolator 関数名から関数を取得 */
function getInterpolator(name: string): (t: number) => string {
  const fn = (chromatic as Record<string, unknown>)[name];
  if (typeof fn === "function") return fn as (t: number) => string;
  return chromatic.interpolateBlues;
}

/** 値ベースのカラースケールを構築（コロプレス地図と同じ仕組み） */
function buildColorScale(
  entries: RankingEntry[],
  scheme = "interpolateBlues",
  schemeType: "sequential" | "diverging" = "sequential",
  midpointValue?: number,
) {
  const values = entries.map((e) => e.value);
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const interpolator = getInterpolator(scheme);
  if (schemeType === "diverging") {
    const colorScale = scaleDiverging(interpolator).domain([minVal, midpointValue ?? (minVal + maxVal) / 2, maxVal]);
    return (value: number) => colorScale(value);
  }
  // sequential: t=0 でもほぼ白にならないよう範囲を 0.25〜1.0 に制限
  const wrappedInterpolator = (t: number) => interpolator(0.25 + t * 0.75);
  const colorScale = scaleSequential(wrappedInterpolator).domain([minVal, maxVal]);
  return (value: number) => colorScale(value);
}

/**
 * 背景色の明るさからテキスト色を自動判定
 * コロプレス地図のグラデーションで視認性を確保するために必要
 */
function getContrastTextColor(bgColor: string): string {
  // rgb(...) 形式をパース
  const match = bgColor.match(/\d+/g);
  if (!match || match.length < 3) return "#FFFFFF";
  const [r, g, b] = match.map(Number);
  // 相対輝度 (W3C)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? "#0F172A" : "#FFFFFF";
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/** 個別タイル */
const Tile: React.FC<{
  cell: TileGridCell;
  entry: RankingEntry | undefined;
  scale: number;
  opacity: number;
  isDark: boolean;
  getColor: (value: number) => string;
}> = ({ cell, entry, scale, opacity, isDark, getColor }) => {
  const w = (cell.w ?? 1) * CELL_SIZE;
  const h = (cell.h ?? 1) * CELL_SIZE;
  const x = (cell.x - GRID_MIN_X) * CELL_SIZE;
  const y = cell.y * CELL_SIZE;
  const fillColor = entry ? getColor(entry.value) : (isDark ? "#334155" : "#E2E8F0");
  const textColor = entry ? getContrastTextColor(fillColor) : (isDark ? "#94A3B8" : "#64748B");

  const nameLen = cell.name.length;
  const nameFontSize = nameLen >= 3 ? 18 : 22;

  return (
    <g
      transform={`translate(${x + w / 2}, ${y + h / 2}) scale(${scale})`}
      opacity={opacity}
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
      {/* 都道府県名 */}
      <text
        x={0}
        y={0}
        textAnchor="middle"
        dominantBaseline="central"
        fill={textColor}
        fontSize={nameFontSize}
        fontWeight={700}
        fontFamily={FONT.family}
        filter={textColor === "#FFFFFF" ? "url(#text-shadow)" : undefined}
      >
        {cell.name}
      </text>
    </g>
  );
};

/** インフォカード（プログレッシブモード用） */
const InfoCard: React.FC<{
  entry: RankingEntry;
  unit: string;
  precision: number;
  isDark: boolean;
  colors: ColorScheme;
  springProgress: number;
  gesBackground?: boolean;
}> = ({ entry, unit, precision, isDark, colors, springProgress, gesBackground = false }) => {
  const isTop3 = entry.rank <= 3;
  const accentColor = isTop3 ? BRAND.secondary : BRAND.primaryLight;
  const translateY = interpolate(springProgress, [0, 1], [40, 0]);
  const formattedValue = formatValueWithPrecision(entry.value, precision);
  // GES 背景時のテキストシャドウ（背景映像と混同しないように）
  const gesShadow = gesBackground ? "0 2px 8px rgba(0,0,0,0.8), 0 0 16px rgba(0,0,0,0.5)" : undefined;
  const gesValueShadow = gesBackground ? "0 0 16px rgba(0,0,0,0.9), 0 2px 8px rgba(0,0,0,0.7)" : undefined;

  return (
    <div
      style={{
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px 36px",
        backgroundColor: isDark
          ? (gesBackground ? "rgba(15, 23, 42, 0.55)" : "rgba(15, 23, 42, 0.3)")
          : (gesBackground ? "rgba(255, 255, 255, 0.5)" : "rgba(255, 255, 255, 0.35)"),
        borderRadius: 28,
        border: `2px solid ${isTop3 ? BRAND.secondary : colors.border}`,
        backdropFilter: "none",
        boxShadow: isDark ? "0 16px 48px rgba(0,0,0,0.3)" : "0 16px 48px rgba(0,0,0,0.06)",
        transform: `translateY(${translateY}px)`,
        opacity: springProgress,
      }}
    >
      {/* 順位 */}
      <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 8 }}>
        <span style={{ fontSize: 36, fontWeight: FONT.weight.bold, color: colors.muted, textShadow: gesShadow }}>第</span>
        <span
          style={{
            fontSize: 96,
            fontWeight: FONT.weight.black,
            lineHeight: 1,
            color: isTop3 ? BRAND.secondary : colors.foreground,
            textShadow: gesShadow,
          }}
        >
          {entry.rank}
        </span>
        <span style={{ fontSize: 36, fontWeight: FONT.weight.bold, color: colors.muted, textShadow: gesShadow }}>位</span>
      </div>

      {/* 都道府県名 */}
      <div
        style={{
          fontSize: 68,
          fontWeight: FONT.weight.black,
          letterSpacing: "-0.02em",
          marginBottom: 12,
          textAlign: "center",
          color: colors.foreground,
          textShadow: gesShadow,
        }}
      >
        {entry.areaName}
      </div>

      {/* 値 + 単位 */}
      <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
        <span
          style={{
            fontSize: 52,
            fontFamily: "'Inter', sans-serif",
            fontWeight: FONT.weight.black,
            color: accentColor,
            textShadow: gesValueShadow,
          }}
        >
          {formattedValue}
        </span>
        <span style={{ fontSize: 32, fontWeight: FONT.weight.bold, color: colors.muted, textShadow: gesShadow }}>
          {unit}
        </span>
      </div>
    </div>
  );
};

/** プログレスバー */
const ProgressBar: React.FC<{
  current: number;
  total: number;
  isDark: boolean;
  colors: ColorScheme;
  gesBackground?: boolean;
}> = ({ current, total, isDark, colors, gesBackground = false }) => {
  const progress = ((total - current + 1) / total) * 100;
  const isTop3 = current <= 3;

  return (
    <div
      style={{
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 12,
      }}
    >
      <div
        style={{
          width: "100%",
          height: 12,
          backgroundColor: `${colors.muted}33`,
          borderRadius: 6,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${progress}%`,
            backgroundColor: isTop3 ? BRAND.secondary : BRAND.primary,
            borderRadius: 6,
          }}
        />
      </div>
      <div
        style={{
          fontSize: 28,
          fontWeight: FONT.weight.bold,
          color: colors.muted,
          fontFamily: FONT.family,
          textShadow: gesBackground ? "0 2px 8px rgba(0,0,0,0.8)" : undefined,
        }}
      >
        {total - current + 1} / {total}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export const TileGridMapScene: React.FC<TileGridMapSceneProps> = ({
  entries,
  meta,
  theme = "dark",
  mode = "static",
  precision = 0,
  revealSchedule,
  colorScheme = "interpolateBlues",
  colorSchemeType = "sequential",
  divergingMidpointValue,
  hookText,
  gesBackground = false,
  displayTitle,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const colors = COLOR_SCHEMES[theme];
  const isDark = theme === "dark";

  const sprOptions = { fps, config: { damping: 12, mass: 0.8 } } as const;
  const brandingSpring = spring({ frame: frame - 3, from: 0, to: 1, ...sprOptions });
  const introSpring    = spring({ frame,             from: 0, to: 1, ...sprOptions });

  // GES 背景時のテキストシャドウ（ヘッダーテキスト用）
  const gesHeaderShadow = gesBackground ? "0 2px 8px rgba(0,0,0,0.8), 0 0 12px rgba(0,0,0,0.5)" : undefined;

  // サブタイトルテキスト（RankingTitle の titleSub と同じ形式）
  const subtitleParts: string[] = [];
  subtitleParts.push(`${meta.yearName || "最新"} 都道府県ランキング`);
  if (meta.subtitle) subtitleParts.push(meta.subtitle);
  if (meta.demographicAttr) subtitleParts.push(meta.demographicAttr);
  if (meta.normalizationBasis) subtitleParts.push(meta.normalizationBasis);
  const subtitleText = subtitleParts.join("・");

  const entryMap = buildEntryMap(entries);

  // 値ベースのカラースケール（コロプレス地図と同じ d3 連続カラースケール）
  const getColor = useMemo(
    () => buildColorScale(entries, colorScheme, colorSchemeType, divergingMidpointValue),
    [entries, colorScheme, colorSchemeType, divergingMidpointValue],
  );

  // entries を rank 降順（47→1）に並べたリスト（プログレッシブ用）
  const sortedByRankDesc = [...entries].sort((a, b) => b.rank - a.rank);

  // プログレッシブモード: 現在表示中の都道府県を判定
  const currentRevealIndex = (() => {
    if (mode !== "progressive" || !revealSchedule) return -1;
    for (let i = revealSchedule.length - 1; i >= 0; i--) {
      if (frame >= revealSchedule[i].startFrame) return i;
    }
    return -1;
  })();

  // 表示済み都道府県コードのセット（プログレッシブ用、2桁正規化）
  const revealedCodes = new Set<string>();
  if (mode === "progressive" && revealSchedule) {
    for (let i = 0; i <= currentRevealIndex; i++) {
      if (sortedByRankDesc[i]) {
        revealedCodes.add(normalizePrefId(sortedByRankDesc[i].areaCode));
      }
    }
  }

  // 現在のエントリ（プログレッシブ用インフォカード）
  const currentEntry = mode === "progressive" && currentRevealIndex >= 0
    ? sortedByRankDesc[currentRevealIndex]
    : null;

  // インフォカードの spring
  const infoSpring = currentEntry
    ? spring({
        frame: frame - (revealSchedule?.[currentRevealIndex]?.startFrame ?? 0),
        from: 0,
        to: 1,
        fps,
        config: { damping: 12, mass: 0.8 },
      })
    : 0;

  // マップの配置計算（static / progressive 共通）
  const mapOffsetY = 460;
  const mapScale = 0.8;
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
      <AbsoluteFill style={{ zIndex: 0 }}>
        {gesBackground && revealSchedule && sortedByRankDesc.length > 0 ? (
          <>
            {/* 各都道府県ごとに独立した Sequence+Video（src 切替による黒フレーム防止） */}
            {sortedByRankDesc.map((entry, i) => {
              const schedule = revealSchedule[i];
              if (!schedule) return null;
              const nextStart = i < revealSchedule.length - 1
                ? revealSchedule[i + 1].startFrame
                : schedule.startFrame + schedule.duration;
              return (
                <Sequence
                  key={entry.areaCode}
                  from={schedule.startFrame}
                  durationInFrames={nextStart - schedule.startFrame + 1}
                >
                  <OffthreadVideo
                    src={getGesVideoPath(entry.areaCode, "portrait")}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    muted
                  />
                </Sequence>
              );
            })}
            <AbsoluteFill
              style={{
                background: isDark
                  ? "linear-gradient(to bottom, rgba(15,23,42,0.6) 0%, rgba(15,23,42,0.3) 30%, rgba(15,23,42,0.3) 70%, rgba(15,23,42,0.6) 100%)"
                  : "linear-gradient(to bottom, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0.2) 30%, rgba(255,255,255,0.2) 70%, rgba(255,255,255,0.5) 100%)",
              }}
            />
            <AbsoluteFill
              style={{
                background: isDark
                  ? "radial-gradient(circle at center, transparent 30%, rgba(15,23,42,0.5) 100%)"
                  : "radial-gradient(circle at center, transparent 30%, rgba(255,255,255,0.3) 100%)",
              }}
            />
          </>
        ) : (
          <>
            <div
              style={{
                position: "absolute",
                inset: 0,
                backgroundImage: `linear-gradient(to right, ${colors.muted}22 2px, transparent 2px), linear-gradient(to bottom, ${colors.muted}22 2px, transparent 2px)`,
                backgroundSize: "48px 48px",
                opacity: isDark ? 0.3 : 0.6,
              }}
            />
            <div
              style={{
                position: "absolute",
                top: "40%",
                left: "50%",
                width: 800,
                height: 800,
                borderRadius: "50%",
                background: `radial-gradient(circle, ${BRAND.primary}44 0%, transparent 70%)`,
                transform: "translateX(-50%)",
                filter: "blur(120px)",
                opacity: 0.4,
              }}
            />
          </>
        )}
      </AbsoluteFill>

      {/* メインコンテンツ */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          zIndex: 10,
        }}
      >
        {/* ヘッダー: ブランド + タイトル（RankingTitle 方式） */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            paddingTop: SAFE_AREA.top + 72,
            paddingLeft: SAFE_AREA.left,
            paddingRight: SAFE_AREA.right,
            gap: 12,
          }}
        >
          {/* stats47 ブランディング（RankingTitle と同じスタイル） */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 20,
              opacity: brandingSpring,
              transform: `translateY(${interpolate(brandingSpring, [0, 1], [-16, 0])}px)`,
            }}
          >
            <div
              style={{
                backgroundColor: BRAND.primary,
                color: "#FFFFFF",
                padding: "8px 22px",
                borderRadius: 8,
                fontSize: 30,
                fontWeight: FONT.weight.black,
                letterSpacing: 1,
              }}
            >
              stats47
            </div>
            <div
              style={{
                fontSize: 32,
                fontWeight: FONT.weight.bold,
                color: colors.muted,
                letterSpacing: 2,
                textShadow: gesHeaderShadow,
              }}
            >
              統計で見る都道府県
            </div>
          </div>

          {/* サブタイトルバッジ（年度・属性情報） */}
          {subtitleText && (
            <div style={{ transform: `scale(${introSpring})`, opacity: introSpring }}>
              <span
                style={{
                  display: "inline-block",
                  backgroundColor: isDark ? "rgba(30, 41, 59, 0.85)" : "rgba(255, 255, 255, 0.9)",
                  color: BRAND.secondary,
                  border: `2px solid ${BRAND.secondary}`,
                  borderRadius: 50,
                  padding: "6px 28px",
                  fontSize: 32,
                  fontWeight: FONT.weight.bold,
                  letterSpacing: "0.1em",
                  boxShadow: `0 0 32px ${BRAND.secondary}44`,
                  backdropFilter: "blur(10px)",
                }}
              >
                {subtitleText}
              </span>
            </div>
          )}

          {/* メインタイトル（スペース区切り・動的フォントサイズ・各行スプリング） */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 4,
            }}
          >
            {(() => {
              const titleText = displayTitle || meta.title;
              const lines = titleText.split(" ");
              const maxLineChars = Math.max(...lines.map((s) => s.length));
              // 3行以上の場合はフォントサイズを縮小して InfoCard との重なりを防ぐ
              const maxFontSize = lines.length >= 3 ? 48 : 64;
              const titleFontSize = Math.min(maxFontSize, Math.floor(800 / maxLineChars));
              return lines.map((line, idx) => {
                const lineSpr = spring({
                  frame: frame - 12 - idx * 5,
                  from: 0,
                  to: 1,
                  ...sprOptions,
                });
                return (
                  <h1
                    key={idx}
                    style={{
                      fontSize: titleFontSize,
                      fontWeight: FONT.weight.black,
                      color: colors.foreground,
                      margin: 0,
                      lineHeight: 1.1,
                      textAlign: "center",
                      transform: `translateY(${interpolate(lineSpr, [0, 1], [40, 0])}px) scale(${lineSpr})`,
                      opacity: lineSpr,
                      textShadow: gesBackground
                        ? "0 2px 8px rgba(0,0,0,0.9), 0 0 24px rgba(0,0,0,0.6)"
                        : isDark
                          ? "0 6px 24px rgba(0,0,0,0.8)"
                          : "0 4px 12px rgba(0,0,0,0.15)",
                    }}
                  >
                    {line}
                  </h1>
                );
              });
            })()}
          </div>
        </div>

        {/* 静的モード: サムネイル用フックテキスト（地図左上の空白に配置） */}
        {mode === "static" && hookText && (
          <div
            style={{
              position: "absolute",
              top: mapOffsetY + 80,
              left: SAFE_AREA.left + 40,
              zIndex: 20,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 16,
            }}
          >
            <div
              style={{
                backgroundColor: BRAND.danger,
                padding: "12px 32px",
                borderRadius: RADIUS.md,
                boxShadow: `0 8px 32px ${BRAND.danger}44`,
              }}
            >
              <div
                style={{
                  fontSize: 36,
                  fontWeight: FONT.weight.black,
                  color: "#FFFFFF",
                  letterSpacing: 1,
                  whiteSpace: "nowrap",
                }}
              >
                {hookText}
              </div>
            </div>
            <div
              style={{
                fontSize: 26,
                fontWeight: FONT.weight.bold,
                color: colors.muted,
                letterSpacing: 2,
              }}
            >
              あなたの地元は何位？
            </div>
          </div>
        )}

        {/* プログレッシブモード: インフォカード（タイトルと地図の間、左上の隙間に配置） */}
        {mode === "progressive" && currentEntry && (
          <div
            style={{
              position: "absolute",
              top: SAFE_AREA.top + 72 + 230,
              left: SAFE_AREA.left,
              width: 520,
              zIndex: 20,
            }}
          >
            <InfoCard
              entry={currentEntry}
              unit={meta.unit}
              precision={precision}
              isDark={isDark}
              colors={colors}
              springProgress={infoSpring}
              gesBackground={gesBackground}
            />
          </div>
        )}

        {/* タイルグリッドマップ */}
        <div
          style={{
            position: "absolute",
            top: mapOffsetY,
            left: -70,
            width: 1080,
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "center",
          }}
        >
          <svg
            viewBox={`0 0 ${GRID_COLS * CELL_SIZE} ${GRID_ROWS * CELL_SIZE}`}
            width={mapDisplayWidth}
            height={mapDisplayHeight}
          >
            <defs>
              <filter id="text-shadow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur in="SourceAlpha" stdDeviation={2.5} result="blur" />
                <feOffset dx={0} dy={1} result="offsetBlur" />
                <feFlood floodColor="#000" floodOpacity={0.7} result="color" />
                <feComposite in="color" in2="offsetBlur" operator="in" result="shadow" />
                <feMerge>
                  <feMergeNode in="shadow" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              {/* 当該タイルのハイライトグロー */}
              <filter id="tile-glow" x="-50%" y="-50%" width="200%" height="200%">
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

              if (mode === "static") {
                // 静的モード: 順位順にスタガードポップイン
                const rank = entry?.rank ?? 47;
                const staggerDelay = (rank - 1) * 0.5; // 0.5フレーム間隔
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
                    entry={entry}
                    scale={tileSpring}
                    opacity={tileSpring}
                    isDark={isDark}
                    getColor={getColor}
                  />
                );
              }

              // プログレッシブモード: 出現済み=色付き、出現中=scale ポップイン、未出現=グレー
              const isRevealed = revealedCodes.has(code);
              const isCurrentlyRevealing = currentEntry
                ? normalizePrefId(currentEntry.areaCode) === code
                : false;

              if (isCurrentlyRevealing && revealSchedule) {
                const revealFrame = revealSchedule[currentRevealIndex]?.startFrame ?? 0;
                const localFrame = frame - revealFrame;

                // バウンシーなスケール（2.0 まで拡大してから 1.0 に戻る）
                const rawSpring = spring({
                  frame: localFrame,
                  from: 0,
                  to: 1,
                  fps,
                  config: { damping: 5, mass: 1.5, stiffness: 80 },
                });
                const tileSpring = interpolate(rawSpring, [0, 1], [0, 2], { extrapolateRight: "clamp" });

                // ハイライトリングの光り＆フェード
                const glowOpacity = interpolate(
                  localFrame,
                  [0, 8, 30, 50],
                  [0, 1, 0.6, 0],
                  { extrapolateRight: "clamp" },
                );
                const glowScale = interpolate(
                  localFrame,
                  [0, 8, 50],
                  [0.5, 1.15, 1.25],
                  { extrapolateRight: "clamp" },
                );

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
                      rx={10}
                      ry={10}
                      fill="none"
                      stroke={accentColor}
                      strokeWidth={5}
                      opacity={glowOpacity}
                      filter="url(#tile-glow)"
                      transform={`translate(${cx}, ${cy}) scale(${glowScale})`}
                    />
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

              // 未出現タイルは非表示
              if (!isRevealed) return null;

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

        {/* プログレッシブモード: プログレスバー */}
        {mode === "progressive" && currentEntry && (
          <div
            style={{
              position: "absolute",
              bottom: 120,
              left: 64,
              right: 64,
            }}
          >
            <ProgressBar
              current={currentEntry.rank}
              total={entries.length}
              isDark={isDark}
              colors={colors}
              gesBackground={gesBackground}
            />
          </div>
        )}

        {/* 静的モード: フッターブランドバー */}
        {mode === "static" && (
          <div
            style={{
              position: "absolute",
              bottom: 100,
              left: 0,
              right: 0,
              display: "flex",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
                padding: "12px 32px",
                backgroundColor: isDark ? "rgba(30, 41, 59, 0.8)" : "rgba(255, 255, 255, 0.9)",
                borderRadius: 50,
                border: `1px solid ${colors.border}`,
              }}
            >
              <span
                style={{
                  fontSize: 32,
                  fontWeight: FONT.weight.black,
                  color: BRAND.primaryLight,
                }}
              >
                stats47.com
              </span>
            </div>
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};
