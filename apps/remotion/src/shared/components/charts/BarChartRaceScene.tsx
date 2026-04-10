import React, { useMemo } from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { schemeTableau10 } from "d3-scale-chromatic";
import type { BarChartRaceFrame } from "@stats47/visualization";
import { formatValueWithPrecision, getMaxDecimalPlaces } from "@stats47/utils";

import { BRAND, COLOR_SCHEMES, FONT, RANK_COLORS, SPACING, type ThemeName } from "@/shared";
import {
  interpolateRaceFrame,
  type EventLabel,
  type InterpolatedBarItem,
} from "../../utils/bar-chart-race";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface BarChartRaceSceneProps {
  frames: BarChartRaceFrame[];
  title: string;
  unit: string;
  /** 表示する上位件数 @default 15 */
  topN?: number;
  /** 1年度あたりのフレーム数 @default 36 */
  framesPerYear?: number;
  /** テーマ @default "dark" */
  theme?: ThemeName;
  /** イベントラベル（特定年度付近に表示） */
  eventLabels?: EventLabel[];
}

// ---------------------------------------------------------------------------
// Layout constants (1080x1920 portrait)
// ---------------------------------------------------------------------------

/** セーフエリア: top 250px, bottom 400px, right 160px */
const SAFE_AREA = { top: 250, bottom: 400, right: 160 };
const HEADER_TOP = SAFE_AREA.top + 10;    // 260px — セーフエリア直下
const HEADER_HEIGHT = 310;                 // ブランド + タイトル + 期間バッジ + 余白
const CHART_PADDING = { top: HEADER_TOP + HEADER_HEIGHT, bottom: SAFE_AREA.bottom, left: 60, right: 60 };
const BAR_HEIGHT = 58;
const BAR_GAP = 16;
const LABEL_WIDTH = 200;
const VALUE_WIDTH = 200;
const DATE_FONT_SIZE = 100;

// ---------------------------------------------------------------------------
// Color assignment
// ---------------------------------------------------------------------------

/** 全フレームの全名前をソートしてインデックス割当 → 色の安定性を確保 */
export function buildColorMap(frames: BarChartRaceFrame[]): Map<string, string> {
  const allNames = new Set<string>();
  for (const frame of frames) {
    for (const item of frame.items) {
      allNames.add(item.name);
    }
  }
  const sorted = [...allNames].sort();
  const map = new Map<string, string>();
  for (let i = 0; i < sorted.length; i++) {
    map.set(sorted[i], schemeTableau10[i % schemeTableau10.length]);
  }
  return map;
}

/** 順位に応じた色を返す（1-3位はランクカラー、4位以下はカテゴリ色） */
export function getBarColor(item: InterpolatedBarItem, rank1Based: number, colorMap: Map<string, string>): string {
  if (rank1Based <= 3) {
    return RANK_COLORS[rank1Based as 1 | 2 | 3].from;
  }
  return colorMap.get(item.name) || schemeTableau10[0];
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const BarChartRaceScene: React.FC<BarChartRaceSceneProps> = ({
  frames,
  title,
  unit,
  topN = 15,
  framesPerYear = 36,
  theme = "dark",
  eventLabels = [],
}) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const colors = COLOR_SCHEMES[theme];
  const isDark = theme === "dark";

  // 色マップ: 全フレームの全名前をソートして安定割当
  const colorMap = useMemo(() => buildColorMap(frames), [frames]);

  // 全フレームの最大値を事前計算（x軸を固定するため）
  const globalMax = useMemo(() => {
    let max = 1;
    for (const f of frames) {
      for (const item of f.items) {
        if (item.value > max) max = item.value;
      }
    }
    return max;
  }, [frames]);

  // 小数点以下の桁数を自動検出（全フレームの全値から最大桁数を取得）
  const decimalPlaces = useMemo(() => {
    const allValues: number[] = [];
    for (const f of frames) {
      for (const item of f.items) {
        allValues.push(item.value);
      }
    }
    return getMaxDecimalPlaces(allValues);
  }, [frames]);

  // 現在の年度インデックスと進行率
  const totalRaceFrames = Math.max(0, frames.length - 1) * framesPerYear;
  const clampedFrame = Math.min(Math.max(0, frame), totalRaceFrames);
  const yearIndex = Math.min(
    Math.floor(clampedFrame / framesPerYear),
    frames.length - 2,
  );
  const t = framesPerYear > 0
    ? (clampedFrame - yearIndex * framesPerYear) / framesPerYear
    : 0;

  // 補間データ取得
  const safeYearIndex = Math.max(0, Math.min(yearIndex, frames.length - 2));
  const items: InterpolatedBarItem[] = frames.length >= 2
    ? interpolateRaceFrame(frames[safeYearIndex], frames[safeYearIndex + 1], Math.min(t, 1), topN)
    : frames.length === 1
      ? frames[0].items
        .sort((a, b) => b.value - a.value)
        .slice(0, topN)
        .map((item, i) => ({ ...item, rank: i, opacity: 1 }))
      : [];

  // 最大値（バー幅の基準）— 全フレームの globalMax で固定
  const maxValue = globalMax;

  // 年度ラベル（補間）
  const currentDate = frames.length >= 2
    ? blendDateLabel(frames[safeYearIndex].date, frames[safeYearIndex + 1].date, t)
    : frames[0]?.date || "";

  // 年コード（イベントラベル照合用）
  const currentYearNum = parseYearFromDate(currentDate);

  // バー描画エリアの幅
  const barAreaWidth = width - CHART_PADDING.left - CHART_PADDING.right - LABEL_WIDTH - VALUE_WIDTH;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: colors.background,
        color: colors.foreground,
        fontFamily: FONT.family,
        overflow: "hidden",
      }}
    >
      {/* ヘッダー: ブランド + タイトル + 期間 */}
      <div
        style={{
          position: "absolute",
          top: HEADER_TOP,
          left: 0,
          right: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 12,
        }}
      >
        {/* ブランドバッジ + 統計で見る都道府県 */}
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              backgroundColor: BRAND.primary,
              color: BRAND.white,
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
            }}
          >
            統計で見る都道府県
          </div>
        </div>

        {/* 期間バッジ */}
        {frames.length > 0 && (
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              backgroundColor: isDark ? "rgba(30, 41, 59, 0.85)" : "rgba(255, 255, 255, 0.9)",
              color: BRAND.secondary,
              border: `3px solid ${BRAND.secondary}`,
              borderRadius: 50,
              padding: "4px 24px",
              fontSize: 36,
              fontWeight: FONT.weight.bold,
              letterSpacing: "0.1em",
              boxShadow: `0 0 32px ${BRAND.secondary}44`,
              backdropFilter: "blur(10px)",
            }}
          >
            {frames[0].date} 〜 {frames[frames.length - 1].date}
          </div>
        )}

        {/* メインタイトル */}
        <div
          style={{
            fontSize: 72,
            fontWeight: FONT.weight.black,
            color: colors.foreground,
            lineHeight: 1.2,
            textAlign: "center",
            textShadow: isDark
              ? "0 6px 24px rgba(0,0,0,0.8)"
              : "0 4px 12px rgba(0,0,0,0.12)",
          }}
        >
          {title}
        </div>

        {/* アンバー区切り線 */}
        <div
          style={{
            width: 120,
            height: 5,
            backgroundColor: BRAND.secondary,
            borderRadius: 3,
            boxShadow: `0 0 20px ${BRAND.secondary}88`,
          }}
        />
      </div>

      {/* メインチャート: 横棒 Top N */}
      <div
        style={{
          position: "absolute",
          top: CHART_PADDING.top,
          left: CHART_PADDING.left,
          right: CHART_PADDING.right,
          bottom: CHART_PADDING.bottom,
        }}
      >
        {items.map((item) => {
          const rank1Based = Math.round(item.rank) + 1;
          const y = item.rank * (BAR_HEIGHT + BAR_GAP);
          const barWidth = Math.max(0, (item.value / maxValue) * barAreaWidth);
          const barColor = getBarColor(item, rank1Based, colorMap);

          return (
            <div
              key={item.name}
              style={{
                position: "absolute",
                top: y,
                left: 0,
                right: 0,
                height: BAR_HEIGHT,
                display: "flex",
                alignItems: "center",
                opacity: item.opacity,
                transition: "none",
              }}
            >
              {/* ラベル */}
              <div
                style={{
                  width: LABEL_WIDTH,
                  textAlign: "right",
                  paddingRight: SPACING.sm,
                  fontSize: 34,
                  fontWeight: FONT.weight.bold,
                  color: colors.foreground,
                  overflow: "hidden",
                  whiteSpace: "nowrap",
                  textOverflow: "ellipsis",
                  flexShrink: 0,
                }}
              >
                {item.name}
              </div>

              {/* バー */}
              <div
                style={{
                  width: barWidth,
                  height: BAR_HEIGHT - 8,
                  backgroundColor: barColor,
                  borderRadius: 6,
                  boxShadow: rank1Based <= 3
                    ? `0 2px 12px ${barColor}88`
                    : "none",
                  flexShrink: 0,
                }}
              />

              {/* 値 */}
              <div
                style={{
                  paddingLeft: SPACING.sm,
                  fontSize: 30,
                  fontWeight: FONT.weight.bold,
                  color: colors.muted,
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                }}
              >
                {formatValueWithPrecision(item.value, decimalPlaces)}
              </div>
            </div>
          );
        })}
      </div>

      {/* 年度ウォーターマーク */}
      <div
        style={{
          position: "absolute",
          bottom: 180,
          right: 60,
          fontSize: DATE_FONT_SIZE,
          fontWeight: FONT.weight.black,
          color: isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.10)",
          lineHeight: 1,
          pointerEvents: "none",
          userSelect: "none",
        }}
      >
        {currentDate}
      </div>

      {/* 単位（年度ウォーターマークの下） */}
      {unit && (
        <div
          style={{
            position: "absolute",
            bottom: 60,
            right: 60,
            fontSize: 36,
            fontWeight: FONT.weight.medium,
            color: isDark ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.15)",
            pointerEvents: "none",
          }}
        >
          単位: {unit}
        </div>
      )}

      {/* イベントラベル */}
      {eventLabels.map((ev) => {
        const evYear = parseInt(ev.year, 10);
        const distance = Math.abs(currentYearNum - evYear);
        // 半年以内でフェードイン/アウト
        const eventOpacity = distance <= 0.5
          ? interpolate(distance, [0, 0.5], [1, 0])
          : 0;

        if (eventOpacity <= 0) return null;

        return (
          <div
            key={ev.year}
            style={{
              position: "absolute",
              bottom: 420,
              right: 60,
              display: "flex",
              justifyContent: "flex-end",
              opacity: eventOpacity,
              pointerEvents: "none",
            }}
          >
            <div
              style={{
                backgroundColor: "rgba(220,38,38,0.9)",
                border: "2px solid rgba(185,28,28,0.9)",
                borderRadius: 8,
                padding: "8px 24px",
                fontSize: 44,
                fontWeight: FONT.weight.black,
                color: "#FFFFFF",
                boxShadow: "0 4px 16px rgba(0,0,0,0.4)",
              }}
            >
              {ev.label}
            </div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** "2020年" → 2020 のように年コードを抽出 */
export function parseYearFromDate(date: string): number {
  const m = date.match(/(\d{4})/);
  return m ? parseInt(m[1], 10) : 0;
}

/** 2つの日付ラベルから t に応じたラベルを返す（前半は A、後半は B） */
export function blendDateLabel(dateA: string, dateB: string, t: number): string {
  return t < 0.5 ? dateA : dateB;
}
