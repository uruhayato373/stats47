import React, { useMemo } from "react";
import {
  AbsoluteFill,
  Audio,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { formatValueWithPrecision } from "@stats47/utils";

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
// Constants – 1920 × 1080 横型レイアウト
// ---------------------------------------------------------------------------

const INTRO_FRAMES = 120; // 4秒 (30fps)
const LEFT_W = 700;
const RIGHT_W = 1920 - LEFT_W; // 1220
const HEADER_H = 120;
const CONTENT_H = 1080 - HEADER_H; // 960

// Chart layout (within the right panel SVG)
const CHART_PAD = { top: 60, right: 180, bottom: 50, left: 100 };
const CHART_W = RIGHT_W - CHART_PAD.left - CHART_PAD.right; // 980
const LINE_CHART_H = 480;
const BAR_CHART_H = 160;
const CHART_GAP = 40;

// Line colors
const LINE_IN = "#60A5FA"; // blue-400
const LINE_OUT = "#F87171"; // red-400
const BAR_POS = "#34D399"; // emerald-400
const BAR_NEG = "#F87171"; // red-400

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface MigrationYear {
  year: string;
  moversIn: number;
  moversOut: number;
  netMigration: number;
}

export interface PrefectureMigration {
  areaCode: string;
  areaName: string;
  timeSeries: MigrationYear[];
}

export type MigrationDataMap = Record<string, PrefectureMigration>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatAxisLabel(value: number): string {
  if (Math.abs(value) >= 10000) {
    const v = value / 10000;
    return Number.isInteger(v) ? `${v}万` : `${v.toFixed(1)}万`;
  }
  return value.toLocaleString();
}

function formatPopulation(value: number): string {
  if (Math.abs(value) >= 10000) {
    return `${(value / 10000).toFixed(1)}万人`;
  }
  return `${value.toLocaleString()}人`;
}

function formatPopulationMan(value: number): string {
  return `${(value / 10000).toFixed(1)}万人`;
}

function niceAxisTicks(min: number, max: number, count = 5): number[] {
  const range = max - min;
  if (range === 0) return [min];
  const rawStep = range / count;
  const mag = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const res = rawStep / mag;
  let step: number;
  if (res <= 1.5) step = mag;
  else if (res <= 3) step = 2 * mag;
  else if (res <= 7) step = 5 * mag;
  else step = 10 * mag;
  const nMin = Math.floor(min / step) * step;
  const nMax = Math.ceil(max / step) * step;
  const ticks: number[] = [];
  for (let v = nMin; v <= nMax + step * 0.01; v += step) {
    ticks.push(Math.round(v * 1000) / 1000);
  }
  return ticks;
}

// ---------------------------------------------------------------------------
// HorizontalRankCard (shared with RankingNormal)
// ---------------------------------------------------------------------------

const HorizontalRankCard: React.FC<{
  rank: number;
  areaName: string;
  value: number;
  unit: string;
  precision: number;
  isDark: boolean;
  colors: ColorScheme;
  yearName?: string;
}> = ({ rank, areaName, value, unit, precision, isDark, colors, yearName }) => {
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
    config: { damping: 14, mass: 0.8, stiffness: 120 },
  });
  const rankSpring = spring({
    frame: frame - 5,
    from: 0,
    to: 1,
    fps,
    config: { damping: 12, mass: 0.6 },
  });
  const valueSpring = spring({
    frame: frame - 12,
    from: 0,
    to: 1,
    fps,
    config: { damping: 14, mass: 0.4 },
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
      <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
        <span style={{ fontSize: 44, fontWeight: FONT.weight.bold, color: colors.muted }}>
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
        <span style={{ fontSize: 44, fontWeight: FONT.weight.bold, color: colors.muted }}>
          位
        </span>
      </div>

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

      <div style={{ width: "60%", height: 3, backgroundColor: colors.border, borderRadius: 2 }} />

      <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
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
        <span style={{ fontSize: 36, fontWeight: FONT.weight.bold, color: colors.muted }}>
          {unit}
        </span>
      </div>

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
      <div style={{ fontSize: 22, fontWeight: FONT.weight.bold, color: colors.muted }}>
        {47 - rank + 1} / 47
      </div>
      {yearName && (
        <div
          style={{
            fontSize: 22,
            fontWeight: FONT.weight.bold,
            color: BRAND.secondary,
            backgroundColor: isDark
              ? "rgba(30,41,59,0.8)"
              : "rgba(0,0,0,0.05)",
            border: `1px solid ${BRAND.secondary}40`,
            borderRadius: 50,
            padding: "4px 18px",
            marginTop: 4,
          }}
        >
          {yearName}
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// MigrationLineChart – 転入者 vs 転出者の折れ線グラフ
// ---------------------------------------------------------------------------

const MigrationLineChart: React.FC<{
  migration: PrefectureMigration;
  isDark: boolean;
  colors: ColorScheme;
}> = ({ migration, isDark, colors }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const ts = migration.timeSeries;
  const maxIdx = ts.length - 1;

  // --- Line chart Y-axis ---
  const lineValues = ts.flatMap((d) => [d.moversIn, d.moversOut]);
  const lineMin = Math.min(...lineValues);
  const lineMax = Math.max(...lineValues);
  const lineMargin = (lineMax - lineMin) * 0.12;
  const lineYTicks = niceAxisTicks(lineMin - lineMargin, lineMax + lineMargin, 5);
  const lineYMin = lineYTicks[0];
  const lineYMax = lineYTicks[lineYTicks.length - 1];

  // --- Bar chart Y-axis ---
  const netValues = ts.map((d) => d.netMigration);
  const netAbsMax = Math.max(...netValues.map(Math.abs)) || 1;
  const barYMax = netAbsMax * 1.2;
  const barZeroY = BAR_CHART_H / 2;

  // --- Scale functions ---
  const xScale = (i: number) => (i / maxIdx) * CHART_W;
  const lineYScale = (v: number) =>
    LINE_CHART_H - ((v - lineYMin) / (lineYMax - lineYMin)) * LINE_CHART_H;
  const barYHeight = (v: number) => (Math.abs(v) / barYMax) * (BAR_CHART_H / 2);

  // --- Animation ---
  const fadeSpring = spring({
    frame,
    from: 0,
    to: 1,
    fps,
    config: { damping: 18, mass: 0.8 },
  });
  const drawSpring = spring({
    frame: frame - 5,
    from: 0,
    to: 1,
    fps,
    config: { damping: 15, mass: 1, stiffness: 80 },
  });
  const labelSpring = spring({
    frame: frame - 30,
    from: 0,
    to: 1,
    fps,
    config: { damping: 12, mass: 0.5 },
  });

  // Progressive line drawing
  const drawIdx = drawSpring * maxIdx;
  const fullIdx = Math.floor(drawIdx);
  const partial = drawIdx - fullIdx;

  function buildPolyline(getValue: (d: MigrationYear) => number): string {
    const pts: string[] = [];
    for (let i = 0; i <= fullIdx && i < ts.length; i++) {
      pts.push(`${xScale(i)},${lineYScale(getValue(ts[i]))}`);
    }
    if (fullIdx < maxIdx && partial > 0) {
      const x0 = xScale(fullIdx);
      const x1 = xScale(fullIdx + 1);
      const y0 = lineYScale(getValue(ts[fullIdx]));
      const y1 = lineYScale(getValue(ts[fullIdx + 1]));
      pts.push(`${x0 + (x1 - x0) * partial},${y0 + (y1 - y0) * partial}`);
    }
    return pts.join(" ");
  }

  const inPolyline = buildPolyline((d) => d.moversIn);
  const outPolyline = buildPolyline((d) => d.moversOut);
  const latest = ts[maxIdx];

  // Inline label Y positions (push apart if overlapping)
  const rawInY = lineYScale(latest.moversIn);
  const rawOutY = lineYScale(latest.moversOut);
  const minGap = 36;
  let inLabelY = rawInY;
  let outLabelY = rawOutY;
  if (Math.abs(inLabelY - outLabelY) < minGap) {
    const mid = (inLabelY + outLabelY) / 2;
    inLabelY = mid - minGap / 2;
    outLabelY = mid + minGap / 2;
  }

  // Bar chart bar width
  const barWidth = Math.min(50, (CHART_W / ts.length) * 0.6);
  const barTopY = CHART_PAD.top + LINE_CHART_H + CHART_GAP;

  return (
    <svg
      width={RIGHT_W}
      height={CONTENT_H}
      viewBox={`0 0 ${RIGHT_W} ${CONTENT_H}`}
      style={{ opacity: fadeSpring }}
    >
      <defs>
        <filter id="glow-in" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur in="SourceGraphic" stdDeviation={3} />
          <feFlood floodColor={LINE_IN} floodOpacity={0.4} />
          <feComposite in2="SourceGraphic" operator="in" result="glow" />
          <feMerge>
            <feMergeNode in="glow" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="glow-out" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur in="SourceGraphic" stdDeviation={3} />
          <feFlood floodColor={LINE_OUT} floodOpacity={0.4} />
          <feComposite in2="SourceGraphic" operator="in" result="glow" />
          <feMerge>
            <feMergeNode in="glow" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* ── Line Chart ── */}
      <g transform={`translate(${CHART_PAD.left}, ${CHART_PAD.top})`}>
        {/* Grid lines + Y-axis labels */}
        {lineYTicks.map((tick) => (
          <g key={tick}>
            <line
              x1={0}
              y1={lineYScale(tick)}
              x2={CHART_W}
              y2={lineYScale(tick)}
              stroke={isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)"}
              strokeDasharray="4,6"
            />
            <text
              x={-16}
              y={lineYScale(tick)}
              textAnchor="end"
              dominantBaseline="central"
              fill={colors.muted}
              fontSize={20}
              fontFamily="'Inter', sans-serif"
              fontWeight={500}
              opacity={0.7}
            >
              {formatAxisLabel(tick)}
            </text>
          </g>
        ))}

        {/* Lines */}
        <polyline
          points={inPolyline}
          fill="none"
          stroke={LINE_IN}
          strokeWidth={4}
          strokeLinecap="round"
          strokeLinejoin="round"
          filter="url(#glow-in)"
        />
        <polyline
          points={outPolyline}
          fill="none"
          stroke={LINE_OUT}
          strokeWidth={4}
          strokeLinecap="round"
          strokeLinejoin="round"
          filter="url(#glow-out)"
        />

        {/* Data point dots */}
        {ts.map((d, i) => {
          if (i > fullIdx) return null;
          return (
            <g key={`dot-${i}`}>
              <circle
                cx={xScale(i)}
                cy={lineYScale(d.moversIn)}
                r={5}
                fill={LINE_IN}
                stroke={isDark ? "#0F172A" : "#FFF"}
                strokeWidth={2}
              />
              <circle
                cx={xScale(i)}
                cy={lineYScale(d.moversOut)}
                r={5}
                fill={LINE_OUT}
                stroke={isDark ? "#0F172A" : "#FFF"}
                strokeWidth={2}
              />
            </g>
          );
        })}

        {/* Inline labels near line ends */}
        <g opacity={labelSpring}>
          <text
            x={xScale(maxIdx) + 16}
            y={inLabelY}
            textAnchor="start"
            dominantBaseline="central"
            fill={LINE_IN}
            fontSize={26}
            fontWeight={700}
            fontFamily={FONT.family}
          >
            転入 {formatPopulation(latest.moversIn)}
          </text>
          <text
            x={xScale(maxIdx) + 16}
            y={outLabelY}
            textAnchor="start"
            dominantBaseline="central"
            fill={LINE_OUT}
            fontSize={26}
            fontWeight={700}
            fontFamily={FONT.family}
          >
            転出 {formatPopulation(latest.moversOut)}
          </text>
        </g>
      </g>

      {/* ── Bar Chart (Net Migration) ── */}
      <g transform={`translate(${CHART_PAD.left}, ${barTopY})`}>
        {/* Zero line */}
        <line
          x1={0}
          y1={barZeroY}
          x2={CHART_W}
          y2={barZeroY}
          stroke={colors.muted}
          strokeWidth={1}
          strokeDasharray="4,4"
          opacity={0.4}
        />

        {/* Bars */}
        {ts.map((d, i) => {
          if (i > fullIdx) return null;
          const h = barYHeight(d.netMigration);
          const isPos = d.netMigration >= 0;
          return (
            <rect
              key={`bar-${i}`}
              x={xScale(i) - barWidth / 2}
              y={isPos ? barZeroY - h : barZeroY}
              width={barWidth}
              height={h}
              fill={isPos ? BAR_POS : BAR_NEG}
              opacity={0.75}
              rx={3}
            />
          );
        })}

      </g>

      {/* ── X-axis labels (shared) ── */}
      <g transform={`translate(${CHART_PAD.left}, ${barTopY + BAR_CHART_H + 10})`}>
        {ts.map((d, i) => (
          <text
            key={d.year}
            x={xScale(i)}
            y={0}
            textAnchor="middle"
            dominantBaseline="hanging"
            fill={colors.muted}
            fontSize={20}
            fontFamily="'Inter', sans-serif"
            fontWeight={600}
          >
            {d.year}
          </text>
        ))}
      </g>

      {/* ── Summary cards ── */}
      {(() => {
        const cardW = 290;
        const cardH = 100;
        const cardGap = 24;
        const totalW = cardW * 3 + cardGap * 2;
        const startX = CHART_PAD.left + (CHART_W - totalW) / 2;
        const cardY = barTopY + BAR_CHART_H + 56;
        const accentH = 4;
        const netColor = latest.netMigration >= 0 ? BAR_POS : BAR_NEG;
        const cards = [
          { label: "転入者数", value: formatPopulationMan(latest.moversIn), color: LINE_IN, sign: "" },
          { label: "転出者数", value: formatPopulationMan(latest.moversOut), color: LINE_OUT, sign: "" },
          { label: "差引増減", value: formatPopulationMan(latest.netMigration), color: netColor, sign: latest.netMigration >= 0 ? "+" : "" },
        ];
        return (
          <g opacity={labelSpring}>
            {cards.map((card, ci) => {
              const cx = startX + ci * (cardW + cardGap);
              return (
                <g key={ci} transform={`translate(${cx}, ${cardY})`}>
                  {/* card background */}
                  <rect
                    x={0}
                    y={0}
                    width={cardW}
                    height={cardH}
                    rx={12}
                    fill={isDark ? "rgba(30,41,59,0.6)" : "rgba(0,0,0,0.03)"}
                    stroke={isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)"}
                    strokeWidth={1}
                  />
                  {/* accent top line */}
                  <rect
                    x={0}
                    y={0}
                    width={cardW}
                    height={accentH}
                    rx={2}
                    fill={card.color}
                    opacity={0.8}
                  />
                  {/* clip accent to card top radius */}
                  <rect
                    x={0}
                    y={0}
                    width={cardW}
                    height={accentH}
                    rx={12}
                    fill={card.color}
                    opacity={0.8}
                  />
                  {/* color dot + label */}
                  <circle cx={20} cy={32} r={6} fill={card.color} />
                  <text
                    x={34}
                    y={32}
                    textAnchor="start"
                    dominantBaseline="central"
                    fill={colors.muted}
                    fontSize={20}
                    fontWeight={600}
                    fontFamily={FONT.family}
                  >
                    {card.label}
                  </text>
                  {/* value */}
                  <text
                    x={cardW - 20}
                    y={68}
                    textAnchor="end"
                    dominantBaseline="central"
                    fill={card.color}
                    fontSize={36}
                    fontWeight={900}
                    fontFamily="'Inter', sans-serif"
                  >
                    {card.sign}{card.value}
                  </text>
                </g>
              );
            })}
          </g>
        );
      })()}

      {/* ── 注釈 ── */}
      <text
        x={RIGHT_W - 20}
        y={CONTENT_H - 16}
        textAnchor="end"
        fill={colors.muted}
        fontSize={16}
        fontFamily="'Inter', sans-serif"
        fontWeight={400}
        opacity={0.5 * labelSpring}
      >
        ※ 転入者数・転出者数は住民基本台帳人口移動報告による都道府県間移動（国際移動を含まない）
      </text>
    </svg>
  );
};

// ---------------------------------------------------------------------------
// IntroSlide
// ---------------------------------------------------------------------------

// Tile grid layout (inline to avoid cross-package import in Remotion)
const INTRO_TILES: { id: number; name: string; x: number; y: number; w?: number; h?: number }[] = [
  { id: 1, name: "北海道", x: 12, y: 0, w: 2, h: 2 },
  { id: 2, name: "青森", x: 12, y: 3, w: 2 }, { id: 3, name: "岩手", x: 13, y: 4 },
  { id: 5, name: "秋田", x: 12, y: 4 }, { id: 4, name: "宮城", x: 13, y: 5 },
  { id: 6, name: "山形", x: 12, y: 5 }, { id: 7, name: "福島", x: 12, y: 6, w: 2 },
  { id: 15, name: "新潟", x: 10, y: 6, w: 2 }, { id: 16, name: "富山", x: 9, y: 6 },
  { id: 17, name: "石川", x: 8, y: 6 }, { id: 18, name: "福井", x: 8, y: 7 },
  { id: 21, name: "岐阜", x: 9, y: 7, h: 2 }, { id: 20, name: "長野", x: 10, y: 7, h: 2 },
  { id: 10, name: "群馬", x: 11, y: 7 }, { id: 9, name: "栃木", x: 12, y: 7 },
  { id: 8, name: "茨城", x: 13, y: 7 }, { id: 19, name: "山梨", x: 11, y: 8 },
  { id: 11, name: "埼玉", x: 12, y: 8 }, { id: 12, name: "千葉", x: 13, y: 8, h: 2 },
  { id: 13, name: "東京", x: 12, y: 9 }, { id: 14, name: "神奈川", x: 12, y: 10 },
  { id: 22, name: "静岡", x: 10, y: 9, w: 2 }, { id: 23, name: "愛知", x: 9, y: 9 },
  { id: 25, name: "滋賀", x: 8, y: 8 }, { id: 24, name: "三重", x: 8, y: 9, h: 2 },
  { id: 26, name: "京都", x: 6, y: 8, w: 2 }, { id: 28, name: "兵庫", x: 5, y: 8, h: 2 },
  { id: 27, name: "大阪", x: 6, y: 9 }, { id: 29, name: "奈良", x: 7, y: 9 },
  { id: 30, name: "和歌山", x: 6, y: 10, w: 2 },
  { id: 31, name: "鳥取", x: 4, y: 8 }, { id: 33, name: "岡山", x: 4, y: 9 },
  { id: 32, name: "島根", x: 3, y: 8 }, { id: 34, name: "広島", x: 3, y: 9 },
  { id: 35, name: "山口", x: 2, y: 8, h: 2 },
  { id: 38, name: "愛媛", x: 3, y: 11 }, { id: 37, name: "香川", x: 4, y: 11 },
  { id: 39, name: "高知", x: 3, y: 12 }, { id: 36, name: "徳島", x: 4, y: 12 },
  { id: 40, name: "福岡", x: 1, y: 10 }, { id: 41, name: "佐賀", x: 0, y: 10 },
  { id: 44, name: "大分", x: 1, y: 11 }, { id: 42, name: "長崎", x: 0, y: 11 },
  { id: 45, name: "宮崎", x: 1, y: 12 }, { id: 43, name: "熊本", x: 0, y: 12 },
  { id: 46, name: "鹿児島", x: 0, y: 13, w: 2 }, { id: 47, name: "沖縄", x: 0, y: 15 },
];

const IntroSlide: React.FC<{
  title: string;
  entries: RankingEntry[];
  isDark: boolean;
  colors: ColorScheme;
}> = ({ title, entries, isDark, colors }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logoSpring = spring({
    frame,
    from: 0,
    to: 1,
    fps,
    config: { damping: 14, mass: 0.8, stiffness: 100 },
  });
  const titleSpring = spring({
    frame: frame - 10,
    from: 0,
    to: 1,
    fps,
    config: { damping: 14, mass: 0.6 },
  });
  const subSpring = spring({
    frame: frame - 22,
    from: 0,
    to: 1,
    fps,
    config: { damping: 14, mass: 0.5 },
  });
  const hookSpring = spring({
    frame: frame - 36,
    from: 0,
    to: 1,
    fps,
    config: { damping: 12, mass: 0.5 },
  });
  const lineSpring = spring({
    frame: frame - 18,
    from: 0,
    to: 1,
    fps,
    config: { damping: 20, mass: 1 },
  });
  const mapSpring = spring({
    frame: frame - 8,
    from: 0,
    to: 1,
    fps,
    config: { damping: 16, mass: 1 },
  });

  // Build value lookup: areaCode prefix (2 digits) → value
  const valueMap = useMemo(() => {
    const m = new Map<number, number>();
    for (const e of entries) {
      const code = parseInt(e.areaCode.substring(0, 2), 10);
      m.set(code, e.value);
    }
    return m;
  }, [entries]);

  const values = entries.map((e) => e.value);
  const vMin = Math.min(...values);
  const vMax = Math.max(...values);

  function tileColor(id: number): string {
    const v = valueMap.get(id);
    if (v === undefined) return colors.muted + "33";
    if (v >= 0) {
      // Green: light green (low) → deep green (high)
      const t = Math.min(v / Math.max(vMax, 1), 1);
      const r = Math.round(34 + (110 - 34) * (1 - t));
      const g = Math.round(197 + (190 - 190) * (1 - t));
      const b = Math.round(94 + (140 - 94) * (1 - t));
      return `rgb(${r},${g},${b})`;
    }
    // Red: light red (low) → deep red (high)
    const t = Math.min(Math.abs(v) / Math.max(Math.abs(vMin), 1), 1);
    const r = Math.round(239 + (220 - 239) * (1 - t));
    const g = Math.round(68 + (140 - 68) * (1 - t));
    const b = Math.round(68 + (140 - 68) * (1 - t));
    return `rgb(${r},${g},${b})`;
  }

  // Tile grid rendering
  const cellSize = 56;
  const gap = 3;
  const gridCols = 14;
  const gridRows = 16;
  const mapW = gridCols * (cellSize + gap);
  const mapH = gridRows * (cellSize + gap);

  return (
    <AbsoluteFill style={{ zIndex: 200 }}>
      {/* Right: tile grid map (rendered first, behind text) */}
      <div
        style={{
          position: "absolute",
          right: 140,
          top: "50%",
          transform: `translateY(-50%) scale(${interpolate(mapSpring, [0, 1], [0.85, 1])})`,
          opacity: mapSpring,
        }}
      >
        <svg width={mapW} height={mapH} viewBox={`0 0 ${mapW} ${mapH}`}>
          {INTRO_TILES.map((tile, idx) => {
            const tileSpring = spring({
              frame: frame - 5 - idx * 0.6,
              from: 0,
              to: 1,
              fps,
              config: { damping: 12, mass: 0.4 },
            });
            const w = (tile.w ?? 1) * cellSize + ((tile.w ?? 1) - 1) * gap;
            const h = (tile.h ?? 1) * cellSize + ((tile.h ?? 1) - 1) * gap;
            const tx = tile.x * (cellSize + gap);
            const ty = tile.y * (cellSize + gap);
            const fill = tileColor(tile.id);
            const fontSize = tile.name.length >= 3 ? 13 : 16;
            return (
              <g key={tile.id} opacity={tileSpring} transform={`translate(${tx}, ${ty})`}>
                <rect
                  width={w}
                  height={h}
                  rx={7}
                  fill={fill}
                  stroke={isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)"}
                  strokeWidth={1}
                />
                <text
                  x={w / 2}
                  y={h / 2}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill="#FFF"
                  fontSize={fontSize}
                  fontWeight={700}
                  fontFamily={FONT.family}
                  opacity={0.95}
                >
                  {tile.name}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Left: text content */}
      <div
        style={{
          position: "absolute",
          left: 80,
          top: 0,
          bottom: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "center",
          gap: 24,
        }}
      >
        {/* stats47 logo */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            opacity: logoSpring,
            transform: `translateY(${interpolate(logoSpring, [0, 1], [-30, 0])}px)`,
          }}
        >
          <div
            style={{
              backgroundColor: BRAND.primary,
              color: "#FFF",
              padding: "10px 28px",
              borderRadius: 8,
              fontSize: 32,
              fontWeight: FONT.weight.black,
              letterSpacing: 1,
            }}
          >
            stats47
          </div>
          <span
            style={{
              fontSize: 30,
              fontWeight: FONT.weight.bold,
              color: colors.muted,
            }}
          >
            統計で見る都道府県
          </span>
        </div>

        {/* Title */}
        <div
          style={{
            fontSize: 100,
            fontWeight: FONT.weight.black,
            color: BRAND.primary,
            letterSpacing: "0.02em",
            lineHeight: 1.1,
            opacity: titleSpring,
            transform: `translateY(${interpolate(titleSpring, [0, 1], [40, 0])}px)`,
          }}
        >
          {title}
          <br />
          ランキング
        </div>

        {/* Underline */}
        <div
          style={{
            width: interpolate(lineSpring, [0, 1], [0, 560]),
            height: 5,
            backgroundColor: BRAND.primary,
            borderRadius: 2,
          }}
        />

        {/* Subtitle */}
        <div
          style={{
            fontSize: 38,
            fontWeight: FONT.weight.bold,
            color: colors.muted,
            opacity: subSpring,
            transform: `translateY(${interpolate(subSpring, [0, 1], [20, 0])}px)`,
          }}
        >
          都道府県間の人口移動 2014〜2024
        </div>

        {/* Hook keywords */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 10,
            marginTop: 16,
            opacity: hookSpring,
            transform: `translateY(${interpolate(hookSpring, [0, 1], [20, 0])}px)`,
          }}
        >
          <div
            style={{
              fontSize: 44,
              fontWeight: FONT.weight.black,
              color: isDark ? "#FCD34D" : "#D97706",
            }}
          >
            東京一極集中が再加速
          </div>
          <div
            style={{
              fontSize: 52,
              fontWeight: FONT.weight.black,
              color: isDark ? "#F87171" : "#DC2626",
              transform: `scale(${interpolate(hookSpring, [0, 0.8, 1], [0.8, 1.05, 1])})`,
              transformOrigin: "left center",
            }}
          >
            32県で人口流出
          </div>
        </div>
      </div>

    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface RankingMigrationProps {
  meta: RankingMeta;
  entries: RankingEntry[];
  migrationData: MigrationDataMap;
  theme?: ThemeName;
  showSafeAreas?: boolean;
  framesPerPref?: number;
  precision?: number;
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export const RankingMigration: React.FC<RankingMigrationProps> = ({
  meta,
  entries,
  migrationData,
  theme = "light",
  showSafeAreas = false,
  framesPerPref,
  precision = 1,
}) => {
  const { fps } = useVideoConfig();
  const colors = COLOR_SCHEMES[theme];
  const isDark = theme === "dark";
  const fpPref = framesPerPref ?? fps * 4;

  // 47 位 → 1 位（降順）
  const sortedEntries = useMemo(
    () => [...entries].sort((a, b) => b.rank - a.rank),
    [entries]
  );

  const bgmPath = staticFile("music/bgm.mp3");

  return (
    <AbsoluteFill
      style={{
        backgroundColor: colors.background,
        color: colors.foreground,
        fontFamily: FONT.family,
        overflow: "hidden",
      }}
    >
      <Audio src={bgmPath} />

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

      {/* ── イントロ ── */}
      <Sequence from={0} durationInFrames={INTRO_FRAMES} layout="none">
        <IntroSlide title={meta.title} entries={entries} isDark={isDark} colors={colors} />
      </Sequence>

      {/* ── ランキング本編（イントロ後） ── */}
      <Sequence from={INTRO_FRAMES} layout="none">
        {/* ヘッダー */}
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
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
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

          <div
            style={{
              fontSize: 44,
              fontWeight: FONT.weight.black,
              color: BRAND.primary,
              borderBottom: `4px solid ${BRAND.primary}`,
              paddingBottom: 4,
            }}
          >
            {meta.title}
          </div>

          {/* spacer to balance flex layout */}
          <div style={{ width: 200 }} />
        </div>

        {/* メインコンテンツ */}
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
                    yearName={meta.yearName}
                  />
                </div>
              </Sequence>
            ))}
          </div>

          {/* 右パネル: 転入・転出 折れ線グラフ */}
          <div
            style={{
              width: RIGHT_W,
              height: CONTENT_H,
              position: "relative",
              overflow: "hidden",
            }}
          >
            {sortedEntries.map((entry: RankingEntry, index: number) => {
              const migration = migrationData[entry.areaCode];
              if (!migration) return null;
              return (
                <Sequence
                  key={`chart-${entry.areaCode}`}
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
                    }}
                  >
                    <MigrationLineChart
                      migration={migration}
                      isDark={isDark}
                      colors={colors}
                    />
                  </div>
                </Sequence>
              );
            })}
          </div>
        </div>
      </Sequence>

      {showSafeAreas && <SafetyZoneOverlay />}
    </AbsoluteFill>
  );
};
