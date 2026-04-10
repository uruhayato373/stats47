import React, { useMemo } from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import type { BarChartRaceFrame } from "@stats47/visualization";
import { formatValueWithPrecision, getMaxDecimalPlaces } from "@stats47/utils";

import { BRAND, COLOR_SCHEMES, FONT, SPACING, type ThemeName } from "@/shared";
import {
  interpolateRaceFrame,
  type EventLabel,
  type InterpolatedBarItem,
} from "../../shared/utils/bar-chart-race";
import {
  buildColorMap,
  getBarColor,
  parseYearFromDate,
  blendDateLabel,
} from "../../shared/components/charts/BarChartRaceScene";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface BarChartRaceNormalSceneProps {
  frames: BarChartRaceFrame[];
  title: string;
  unit: string;
  /** 表示する上位件数 @default 47 */
  topN?: number;
  /** 1年度あたりのフレーム数 @default 36 */
  framesPerYear?: number;
  /** テーマ @default "dark" */
  theme?: ThemeName;
  /** イベントラベル（特定年度付近に表示） */
  eventLabels?: EventLabel[];
}

// ---------------------------------------------------------------------------
// Layout constants (1920x1080 landscape — 16:9, 2列全47都道府県)
// ---------------------------------------------------------------------------

const HEADER_HEIGHT = 60;
const HEADER_PADDING_TOP = 16;
const CHART_PADDING = { top: 80, bottom: 50, left: 40, right: 40 };
const COLUMN_GAP = 40;
const ROWS_LEFT = 24;
const BAR_GAP = 2;
const LABEL_FONT_SIZE = 18;
const VALUE_FONT_SIZE = 16;
const LABEL_WIDTH = 80;
const DATE_FONT_SIZE = 140;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const BarChartRaceNormalScene: React.FC<BarChartRaceNormalSceneProps> = ({
  frames,
  title,
  unit,
  topN = 47,
  framesPerYear = 36,
  theme = "dark",
  eventLabels = [],
}) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const colors = COLOR_SCHEMES[theme];
  const isDark = theme === "dark";

  const colorMap = useMemo(() => buildColorMap(frames), [frames]);

  const globalMax = useMemo(() => {
    let max = 1;
    for (const f of frames) {
      for (const item of f.items) {
        if (item.value > max) max = item.value;
      }
    }
    return max;
  }, [frames]);

  const decimalPlaces = useMemo(() => {
    const allValues: number[] = [];
    for (const f of frames) {
      for (const item of f.items) {
        allValues.push(item.value);
      }
    }
    return getMaxDecimalPlaces(allValues);
  }, [frames]);

  // 全国合計を計算
  const nationalTotal = useMemo(() => {
    if (frames.length === 0) return 0;
    // 最初のフレームの全items合計
    return frames[0].items.reduce((sum, item) => sum + item.value, 0);
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

  const safeYearIndex = Math.max(0, Math.min(yearIndex, frames.length - 2));
  const items: InterpolatedBarItem[] = frames.length >= 2
    ? interpolateRaceFrame(frames[safeYearIndex], frames[safeYearIndex + 1], Math.min(t, 1), topN)
    : frames.length === 1
      ? frames[0].items
        .sort((a, b) => b.value - a.value)
        .slice(0, topN)
        .map((item, i) => ({ ...item, rank: i, opacity: 1 }))
      : [];

  // 現在フレームの全国合計を計算
  const currentTotal = useMemo(() => {
    return items.reduce((sum, item) => sum + item.value, 0);
  }, [items]);

  const maxValue = globalMax;

  const currentDate = frames.length >= 2
    ? blendDateLabel(frames[safeYearIndex].date, frames[safeYearIndex + 1].date, t)
    : frames[0]?.date || "";

  const currentYearNum = parseYearFromDate(currentDate);

  // 2列レイアウトの計算
  const chartAreaHeight = height - CHART_PADDING.top - CHART_PADDING.bottom;
  const columnWidth = (width - CHART_PADDING.left - CHART_PADDING.right - COLUMN_GAP) / 2;
  const barHeight = Math.floor((chartAreaHeight - BAR_GAP * (ROWS_LEFT - 1)) / ROWS_LEFT);

  // 左列のバー幅基準（列幅からラベル分を引く）
  const barAreaWidth = columnWidth - LABEL_WIDTH - 10;

  // 左列 (1-24位) と右列 (25-47位) に分割
  const leftItems = items.filter((item) => Math.round(item.rank) < ROWS_LEFT);
  const rightItems = items.filter((item) => Math.round(item.rank) >= ROWS_LEFT);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: isDark ? "#000000" : colors.background,
        color: colors.foreground,
        fontFamily: FONT.family,
        overflow: "hidden",
      }}
    >
      {/* ヘッダー: 左にタイトル、右に全国合計 */}
      <div
        style={{
          position: "absolute",
          top: HEADER_PADDING_TOP,
          left: CHART_PADDING.left,
          right: CHART_PADDING.right,
          height: HEADER_HEIGHT,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div
          style={{
            fontSize: 32,
            fontWeight: FONT.weight.black,
            color: colors.foreground,
          }}
        >
          {title}
        </div>
        <div
          style={{
            fontSize: 28,
            fontWeight: FONT.weight.bold,
            color: colors.muted,
          }}
        >
          全国　{formatValueWithPrecision(currentTotal, 0).toLocaleString()}
        </div>
      </div>

      {/* 左列 (1-24位) */}
      <div
        style={{
          position: "absolute",
          top: CHART_PADDING.top,
          left: CHART_PADDING.left,
          width: columnWidth,
          bottom: CHART_PADDING.bottom,
        }}
      >
        {leftItems.map((item) => {
          const localRank = item.rank;
          const rank1Based = Math.round(localRank) + 1;
          const y = localRank * (barHeight + BAR_GAP);
          const barWidth = Math.max(0, (item.value / maxValue) * barAreaWidth);
          const barColor = getBarColor(item, rank1Based, colorMap);

          return (
            <BarRow
              key={item.name}
              item={item}
              y={y}
              barHeight={barHeight}
              barWidth={barWidth}
              barColor={barColor}
              decimalPlaces={decimalPlaces}
              colors={colors}
            />
          );
        })}
      </div>

      {/* 右列 (25-47位) */}
      <div
        style={{
          position: "absolute",
          top: CHART_PADDING.top,
          left: CHART_PADDING.left + columnWidth + COLUMN_GAP,
          width: columnWidth,
          bottom: CHART_PADDING.bottom,
        }}
      >
        {rightItems.map((item) => {
          const localRank = item.rank - ROWS_LEFT;
          const rank1Based = Math.round(item.rank) + 1;
          const y = localRank * (barHeight + BAR_GAP);
          const barWidth = Math.max(0, (item.value / maxValue) * barAreaWidth);
          const barColor = getBarColor(item, rank1Based, colorMap);

          return (
            <BarRow
              key={item.name}
              item={item}
              y={y}
              barHeight={barHeight}
              barWidth={barWidth}
              barColor={barColor}
              decimalPlaces={decimalPlaces}
              colors={colors}
            />
          );
        })}
      </div>

      {/* 年度ウォーターマーク（右下、大きく） */}
      <div
        style={{
          position: "absolute",
          bottom: 30,
          right: 60,
          fontSize: DATE_FONT_SIZE,
          fontWeight: FONT.weight.black,
          color: isDark ? "rgba(255,255,255,0.20)" : "rgba(0,0,0,0.10)",
          lineHeight: 1,
          pointerEvents: "none",
          userSelect: "none",
        }}
      >
        {currentDate}
      </div>

      {/* イベントラベル */}
      {eventLabels.map((ev) => {
        const evYear = parseInt(ev.year, 10);
        const distance = Math.abs(currentYearNum - evYear);
        const eventOpacity = distance <= 0.5
          ? interpolate(distance, [0, 0.5], [1, 0])
          : 0;

        if (eventOpacity <= 0) return null;

        return (
          <div
            key={ev.year}
            style={{
              position: "absolute",
              bottom: 180,
              right: 60,
              opacity: eventOpacity,
              pointerEvents: "none",
            }}
          >
            <div
              style={{
                backgroundColor: "rgba(220,38,38,0.9)",
                border: "2px solid rgba(185,28,28,0.9)",
                borderRadius: 8,
                padding: "6px 20px",
                fontSize: 32,
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
// 内部コンポーネント
// ---------------------------------------------------------------------------

interface BarRowProps {
  item: InterpolatedBarItem;
  y: number;
  barHeight: number;
  barWidth: number;
  barColor: string;
  decimalPlaces: number;
  colors: (typeof COLOR_SCHEMES)[ThemeName];
}

const BarRow: React.FC<BarRowProps> = ({
  item,
  y,
  barHeight,
  barWidth,
  barColor,
  decimalPlaces,
  colors,
}) => (
  <div
    style={{
      position: "absolute",
      top: y,
      left: 0,
      right: 0,
      height: barHeight,
      display: "flex",
      alignItems: "center",
      opacity: item.opacity,
    }}
  >
    {/* 都道府県名 */}
    <div
      style={{
        width: LABEL_WIDTH,
        textAlign: "right",
        paddingRight: 8,
        fontSize: LABEL_FONT_SIZE,
        fontWeight: FONT.weight.bold,
        color: colors.foreground,
        overflow: "hidden",
        whiteSpace: "nowrap",
        flexShrink: 0,
      }}
    >
      {item.name}
    </div>

    {/* バー */}
    <div
      style={{
        width: barWidth,
        height: barHeight - 4,
        backgroundColor: barColor,
        borderRadius: 3,
        flexShrink: 0,
      }}
    />

    {/* 値 */}
    <div
      style={{
        paddingLeft: 6,
        fontSize: VALUE_FONT_SIZE,
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
