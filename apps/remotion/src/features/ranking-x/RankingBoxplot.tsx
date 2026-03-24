import React from "react";
import { AbsoluteFill } from "remotion";

import { REGIONS } from "@stats47/area";
import { computeAxisDomain } from "@stats47/ranking/utils";
import { formatValueWithPrecision } from "@stats47/utils";
import { BRAND, COLOR_SCHEMES, FONT, RADIUS, SPACING, type ThemeName } from "@/shared/themes/brand";
import type { RankingEntry, RankingMeta } from "@/shared/types/ranking";

// ------------------------------------------------------------------
// チャートレイアウト (OGP 1200x630)
// ------------------------------------------------------------------

const W = 1200;
const H = 630;
const HEADER_H = 110; // HTML ヘッダーの推定高さ
const SVG_H = H - HEADER_H;
const MARGIN = { top: 20, right: 50, bottom: 60, left: 50 };
const INNER_W = W - MARGIN.left - MARGIN.right;
const INNER_H = SVG_H - MARGIN.top - MARGIN.bottom;
const BOX_WIDTH_RATIO = 0.5;
const JITTER_WIDTH_RATIO = 0.6;

// ------------------------------------------------------------------
// 数学ユーティリティ
// ------------------------------------------------------------------

function quantile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  if (sorted.length === 1) return sorted[0];
  const h = (sorted.length - 1) * p;
  const lo = Math.floor(h);
  const hi = Math.ceil(h);
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (h - lo);
}

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0x100000000;
  };
}

// ------------------------------------------------------------------
// Props
// ------------------------------------------------------------------

interface RankingBoxplotProps {
  meta: RankingMeta;
  /** 全47都道府県分のエントリ（areaCode "00000" は自動除外） */
  entries: RankingEntry[];
  theme?: ThemeName;
  /** 値の小数桁数（resolveRankingData の precision を渡す） */
  precision?: number;
  /** Y軸最小値の扱い: "zero"（0始まり）| "data-min"（データ最小値基準） */
  minValueType?: "zero" | "data-min";
}

// ------------------------------------------------------------------
// コンポーネント
// ------------------------------------------------------------------

/**
 * 地域別（7地方区分）箱ひげ図＋ジッター散布図
 *
 * Remotion renderStill 対応の宣言的 React SVG コンポーネント。
 * packages/visualization の BoxplotChart と同一ロジックだが
 * D3 DOM 操作 (useRef/useEffect) を使わず、JSX で描画する。
 */
export const RankingBoxplot: React.FC<RankingBoxplotProps> = ({
  meta,
  entries,
  theme = "light",
  precision = 0,
  minValueType,
}) => {
  const colors = COLOR_SCHEMES[theme];
  const isDark = theme === "dark";
  const textColor = isDark ? "#F1F5F9" : "#1e293b";
  const mutedColor = isDark ? "#94A3B8" : "#64748b";
  const gridColor = isDark
    ? "rgba(148,163,184,0.15)"
    : "rgba(199,206,224,0.3)";

  // ヘッダーテキストの構成（RankingChartX と同じ）
  const line1 = meta.yearName
    ? `${meta.yearName} 都道府県ランキング`
    : "都道府県ランキング";
  const attrParts: string[] = [];
  if (meta.subtitle) attrParts.push(meta.subtitle);
  if (meta.demographicAttr) attrParts.push(meta.demographicAttr);
  if (meta.normalizationBasis) attrParts.push(meta.normalizationBasis);
  const attrText = attrParts.join("・");

  // 全国データを除外
  const filtered = entries.filter((e) => e.areaCode !== "00000");
  if (filtered.length === 0) return null;

  // 地域別グルーピング・統計量
  const grouped = REGIONS.map((region) => {
    const items = filtered.filter((d) =>
      (region.prefectures as readonly string[]).includes(d.areaCode)
    );
    const values = items.map((d) => d.value).sort((a, b) => a - b);
    const min = values.length > 0 ? values[0] : 0;
    const max = values.length > 0 ? values[values.length - 1] : 0;
    const q1 = quantile(values, 0.25);
    const median = quantile(values, 0.5);
    const q3 = quantile(values, 0.75);
    return { ...region, items, min, max, q1, median, q3 };
  });

  // Y スケール
  const allValues = filtered.map((e) => e.value);
  const axisDomain = computeAxisDomain(allValues, { clampMinToZero: minValueType !== "data-min" });
  const yDomainMin = axisDomain.min;
  const yDomainMax = axisDomain.max;

  const yScale = (v: number): number =>
    INNER_H - ((v - yDomainMin) / (yDomainMax - yDomainMin)) * INNER_H;

  // X バンドスケール
  const bandPadding = 0.2;
  const bandStep = INNER_W / grouped.length;
  const bandWidth = bandStep * (1 - bandPadding);
  const xBand = (i: number) => bandStep * i + (bandStep - bandWidth) / 2;
  const boxW = bandWidth * BOX_WIDTH_RATIO;
  const cx = bandWidth / 2;

  // Y 軸目盛り
  const tickCount = 6;
  const yTicks: number[] = [];
  for (let i = 0; i <= tickCount; i++) {
    yTicks.push(
      yDomainMin + ((yDomainMax - yDomainMin) * i) / tickCount
    );
  }

  // ジッター位置（シード固定）
  const rng = seededRandom(42);
  const jitterData = grouped.map((region) => ({
    dots: region.items.map((item) => ({
      item,
      jx: cx + (rng() - 0.5) * bandWidth * JITTER_WIDTH_RATIO,
      jy: yScale(item.value),
    })),
  }));

  return (
    <AbsoluteFill
      style={{
        backgroundColor: colors.background,
        fontFamily: FONT.family,
        color: colors.foreground,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* ヘッダー（RankingChartX と同じスタイル） */}
      <div
        style={{
          borderTop: `4px solid ${BRAND.primary}`,
          backgroundColor: colors.card,
          padding: `10px ${SPACING.lg}px 12px`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 4,
        }}
      >
        <div
          style={{
            fontSize: 18,
            fontWeight: FONT.weight.bold,
            color: colors.muted,
            letterSpacing: 2,
          }}
        >
          {line1}
        </div>
        <div
          style={{
            fontSize: 34,
            fontWeight: FONT.weight.black,
            color: colors.foreground,
            letterSpacing: 1,
            textAlign: "center",
            lineHeight: 1.2,
          }}
        >
          {meta.title}
        </div>
        {attrText && (
          <div
            style={{
              fontSize: 15,
              fontWeight: FONT.weight.medium,
              color: colors.muted,
              backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)",
              padding: "3px 16px",
              borderRadius: RADIUS.full,
              letterSpacing: 1,
            }}
          >
            {attrText}
          </div>
        )}
      </div>

      {/* チャート（SVG） */}
      <svg viewBox={`0 0 ${W} ${SVG_H}`} width="100%" style={{ flex: 1 }}>
        {/* チャートエリア */}
        <g transform={`translate(${MARGIN.left},${MARGIN.top})`}>
          {/* グリッド線 */}
          {yTicks.map((tick) => (
            <line
              key={`grid-${tick}`}
              x1={0}
              x2={INNER_W}
              y1={yScale(tick)}
              y2={yScale(tick)}
              stroke={gridColor}
              strokeWidth={1}
            />
          ))}

          {/* Y軸 */}
          <line
            x1={0}
            y1={0}
            x2={0}
            y2={INNER_H}
            stroke={mutedColor}
            strokeWidth={1}
          />
          {yTicks.map((tick) => (
            <text
              key={`ytick-${tick}`}
              x={-10}
              y={yScale(tick)}
              textAnchor="end"
              dominantBaseline="middle"
              fill={mutedColor}
              fontSize={14}
            >
              {formatValueWithPrecision(tick, precision)}
            </text>
          ))}

          {/* X軸 */}
          <line
            x1={0}
            y1={INNER_H}
            x2={INNER_W}
            y2={INNER_H}
            stroke={mutedColor}
            strokeWidth={1}
          />

          {/* 各地方区分 */}
          {grouped.map((region, i) => {
            const x0 = xBand(i);
            const cxPos = x0 + cx;
            const dots = jitterData[i].dots;

            const maxItem = region.items.find(
              (d) => d.value === region.max
            );
            const minItem = region.items.find(
              (d) => d.value === region.min
            );

            return (
              <g key={region.regionName}>
                {/* ヒゲ: min→Q1 */}
                <line
                  x1={cxPos}
                  x2={cxPos}
                  y1={yScale(region.min)}
                  y2={yScale(region.q1)}
                  stroke={mutedColor}
                  strokeWidth={1}
                />
                {/* ヒゲ: Q3→max */}
                <line
                  x1={cxPos}
                  x2={cxPos}
                  y1={yScale(region.q3)}
                  y2={yScale(region.max)}
                  stroke={mutedColor}
                  strokeWidth={1}
                />
                {/* ヒゲ端の横棒 (min) */}
                <line
                  x1={cxPos - boxW / 4}
                  x2={cxPos + boxW / 4}
                  y1={yScale(region.min)}
                  y2={yScale(region.min)}
                  stroke={mutedColor}
                  strokeWidth={1}
                />
                {/* ヒゲ端の横棒 (max) */}
                <line
                  x1={cxPos - boxW / 4}
                  x2={cxPos + boxW / 4}
                  y1={yScale(region.max)}
                  y2={yScale(region.max)}
                  stroke={mutedColor}
                  strokeWidth={1}
                />
                {/* 箱 (Q1〜Q3) */}
                <rect
                  x={cxPos - boxW / 2}
                  y={yScale(region.q3)}
                  width={boxW}
                  height={yScale(region.q1) - yScale(region.q3)}
                  fill={region.color}
                  fillOpacity={0.5}
                  stroke={mutedColor}
                  strokeWidth={1}
                />
                {/* 中央値ライン */}
                <line
                  x1={cxPos - boxW / 2}
                  x2={cxPos + boxW / 2}
                  y1={yScale(region.median)}
                  y2={yScale(region.median)}
                  stroke={mutedColor}
                  strokeWidth={2}
                />
                {/* ジッター散布点 */}
                {dots.map((dot) => (
                  <circle
                    key={dot.item.areaCode}
                    cx={x0 + dot.jx}
                    cy={dot.jy}
                    r={4}
                    fill={region.color}
                    fillOpacity={0.9}
                    stroke="white"
                    strokeWidth={1}
                  />
                ))}
                {/* 最大値ラベル */}
                {maxItem && (
                  <text
                    x={cxPos}
                    y={yScale(region.max) - 28}
                    textAnchor="middle"
                    fill={textColor}
                  >
                    <tspan
                      x={cxPos}
                      dy={0}
                      fontSize={14}
                      fontWeight={FONT.weight.bold}
                    >
                      {maxItem.areaName}
                    </tspan>
                    <tspan
                      x={cxPos}
                      dy="1.2em"
                      fontSize={14}
                      fontWeight={FONT.weight.bold}
                    >
                      {formatValueWithPrecision(maxItem.value, precision)}
                    </tspan>
                  </text>
                )}
                {/* 最小値ラベル */}
                {minItem && (
                  <text
                    x={cxPos}
                    y={yScale(region.min) + 15}
                    textAnchor="middle"
                    fill={textColor}
                  >
                    <tspan
                      x={cxPos}
                      dy={0}
                      fontSize={14}
                      fontWeight={FONT.weight.bold}
                    >
                      {minItem.areaName}
                    </tspan>
                    <tspan
                      x={cxPos}
                      dy="1.2em"
                      fontSize={14}
                      fontWeight={FONT.weight.bold}
                    >
                      {formatValueWithPrecision(minItem.value, precision)}
                    </tspan>
                  </text>
                )}
                {/* X軸ラベル */}
                <text
                  x={cxPos}
                  y={INNER_H + 20}
                  textAnchor="middle"
                  dominantBaseline="hanging"
                  fill={mutedColor}
                  fontSize={16}
                  fontWeight={FONT.weight.bold}
                >
                  {region.regionName}
                </text>
              </g>
            );
          })}
        </g>

      </svg>

    </AbsoluteFill>
  );
};
