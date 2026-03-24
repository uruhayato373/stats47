/**
 * 積み上げ棒グラフ SVG 生成（垂直・水平、100%正規化対応）
 *
 * StatsSchema[] を受け取り、xKey をグループ、seriesKey をセグメントとして描画する。
 *
 * ## 使い方（垂直・負値対応）
 * ```ts
 * const svg = generateStackedBarSvg(data, {
 *   title: "実質GDP成長率の寄与度分解",
 *   xKey: "yearCode",
 *   seriesKey: "categoryCode",
 *   unit: "%",
 * });
 * ```
 *
 * ## 使い方（水平 100% 積み上げ）
 * ```ts
 * const svg = generateStackedBarSvg(data, {
 *   title: "年齢階級別 仕事内容 vs 賃金",
 *   xKey: "areaCode",
 *   seriesKey: "categoryCode",
 *   unit: "%",
 *   horizontal: true,
 *   normalized: true,
 * });
 * ```
 */

import { FONT_FAMILY } from "../shared/color";
import { niceTicks, linearScale, formatTick } from "../shared/axis";
import { makePlotArea, px } from "../shared/layout";
import {
  StatsSchema,
  DimensionKey,
  uniqueDimension,
  buildValueMap,
} from "../shared/stats-schema";

/** 積み上げ棒グラフのカラーセット */
const STACKED_COLORS = [
  "#1e88e5", // blue
  "#e53935", // red
  "#43a047", // green
  "#fb8c00", // orange
  "#8e24aa", // purple
  "#00897b", // teal
];

export interface StackedBarOptions {
  /** チャートタイトル */
  title: string;
  /** サブタイトル（年次・出典など） */
  subtitle?: string;
  /** aria-label（省略時: title） */
  ariaLabel?: string;
  /** グループ（X 軸 or 行）の次元キー */
  xKey: DimensionKey;
  /** セグメントの次元キー */
  seriesKey: DimensionKey;
  /** 単位 */
  unit?: string;
  /** true のとき 100% 正規化（デフォルト: false） */
  normalized?: boolean;
  /** true のとき横棒グラフ（デフォルト: false） */
  horizontal?: boolean;
}

export function generateStackedBarSvg(data: StatsSchema[], options: StackedBarOptions): string {
  const { horizontal = false, normalized = false } = options;
  return horizontal
    ? generateHorizontal(data, options, normalized)
    : generateVertical(data, options, normalized);
}

// ─── 垂直積み上げ棒グラフ ────────────────────────────────────────────────────

function generateVertical(
  data: StatsSchema[],
  options: StackedBarOptions,
  normalized: boolean,
): string {
  const { title, subtitle, ariaLabel = title, xKey, seriesKey, unit } = options;

  const xItems = uniqueDimension(data, xKey);
  const series = uniqueDimension(data, seriesKey);
  const valueMap = buildValueMap(data, xKey, seriesKey);

  const W = 520;
  const LEGEND_H = Math.ceil(series.length / 3) * 22 + 12;
  const H = 380 + LEGEND_H;
  const plot = makePlotArea(W, H, { top: 58, right: 24, bottom: 58 + LEGEND_H, left: 55 });

  // 値の計算（正規化 or 生値）
  function getValues(xCode: string): number[] {
    return series.map((s) => valueMap.get(xCode)?.get(s.code) ?? 0);
  }

  // Y 軸範囲（正値の合計 and 負値の合計を考慮）
  let globalYMax = 0;
  let globalYMin = 0;
  for (const x of xItems) {
    const vals = getValues(x.code);
    let posSum = 0;
    let negSum = 0;
    for (const v of vals) {
      if (v >= 0) posSum += v;
      else negSum += v;
    }
    if (normalized) {
      globalYMax = 100;
      globalYMin = 0;
    } else {
      globalYMax = Math.max(globalYMax, posSum);
      globalYMin = Math.min(globalYMin, negSum);
    }
  }

  const yTicks = niceTicks(globalYMin, globalYMax, 5);
  const yScaleLo = yTicks[0];
  const yScaleHi = yTicks[yTicks.length - 1];
  const toSvgY = linearScale(yScaleLo, yScaleHi, plot.bottom, plot.top);

  const barW = Math.min(60, plot.width / xItems.length - 12);
  const groupW = plot.width / xItems.length;

  // Y グリッド
  const yGridLines = yTicks.map((v) => {
    const y = px(toSvgY(v));
    return [
      `  <line x1="${px(plot.left)}" y1="${y}" x2="${px(plot.right)}" y2="${y}" stroke="#e5e7eb" stroke-width="1"/>`,
      `  <text x="${(plot.left - 5).toFixed(1)}" y="${(toSvgY(v) + 3.5).toFixed(1)}" text-anchor="end" font-size="8.5" fill="#6b7280">${formatTick(v)}</text>`,
    ].join("\n");
  });

  // ゼロライン
  const zeroY = toSvgY(0);
  const zeroLine =
    globalYMin < 0
      ? `  <line x1="${px(plot.left)}" y1="${px(zeroY)}" x2="${px(plot.right)}" y2="${px(zeroY)}" stroke="#6b7280" stroke-width="1.5"/>`
      : "";

  // 棒の描画（負値は 0 から下方向、正値は 0 から上方向に積む）
  const bars: string[] = [];
  const xLabels: string[] = [];

  xItems.forEach((x, xi) => {
    const cx = plot.left + groupW * xi + groupW / 2;
    xLabels.push(
      `  <text x="${cx.toFixed(1)}" y="${(plot.bottom + 14).toFixed(1)}" text-anchor="middle" font-size="9" fill="#6b7280">${x.name}</text>`,
    );

    const rawVals = getValues(x.code);
    let totalPos = normalized ? rawVals.filter((v) => v > 0).reduce((a, b) => a + b, 0) : 1;

    let posTop = zeroY;
    let negBottom = zeroY;

    series.forEach((s, si) => {
      const raw = valueMap.get(x.code)?.get(s.code) ?? 0;
      const v = normalized ? (raw / totalPos) * 100 : raw;
      if (v === 0) return;

      const color = STACKED_COLORS[si % STACKED_COLORS.length];
      const barLeft = cx - barW / 2;

      if (v > 0) {
        const top = toSvgY(toSvgYInverse(posTop, plot.bottom, plot.top, yScaleLo, yScaleHi) + v);
        const h = Math.abs(posTop - top);
        bars.push(
          `  <rect x="${barLeft.toFixed(1)}" y="${top.toFixed(1)}" width="${barW.toFixed(1)}" height="${h.toFixed(1)}" fill="${color}" fill-opacity="0.85"/>`,
        );
        if (h > 12) {
          bars.push(
            `  <text x="${cx.toFixed(1)}" y="${(top + h / 2 + 3.5).toFixed(1)}" text-anchor="middle" font-size="7.5" fill="#fff">${formatTick(Math.abs(raw))}</text>`,
          );
        }
        posTop = top;
      } else {
        const bottom = toSvgY(
          toSvgYInverse(negBottom, plot.bottom, plot.top, yScaleLo, yScaleHi) + v,
        );
        const h = Math.abs(bottom - negBottom);
        bars.push(
          `  <rect x="${barLeft.toFixed(1)}" y="${negBottom.toFixed(1)}" width="${barW.toFixed(1)}" height="${h.toFixed(1)}" fill="${color}" fill-opacity="0.85"/>`,
        );
        if (h > 12) {
          bars.push(
            `  <text x="${cx.toFixed(1)}" y="${(negBottom + h / 2 + 3.5).toFixed(1)}" text-anchor="middle" font-size="7.5" fill="#fff">${formatTick(Math.abs(raw))}</text>`,
          );
        }
        negBottom = bottom;
      }
    });
  });

  // 凡例（下部）
  const legendY = plot.bottom + 32;
  const legendItems = series.map((s, si) => {
    const col = si % 3;
    const row = Math.floor(si / 3);
    const lx = plot.left + col * (plot.width / 3);
    const ly = legendY + row * 22;
    const color = STACKED_COLORS[si % STACKED_COLORS.length];
    return [
      `  <rect x="${lx.toFixed(1)}" y="${ly.toFixed(1)}" width="12" height="10" fill="${color}" fill-opacity="0.85" rx="2"/>`,
      `  <text x="${(lx + 16).toFixed(1)}" y="${(ly + 8.5).toFixed(1)}" font-size="9" fill="#374151">${s.name}</text>`,
    ].join("\n");
  });

  const unitLabel = unit
    ? `  <text x="${px(plot.left)}" y="${(plot.top - 6).toFixed(1)}" font-size="8.5" fill="#9ca3af">(${unit})</text>`
    : "";

  const titleLines = [
    `  <text x="${W / 2}" y="22" text-anchor="middle" font-size="12.5" font-weight="bold" fill="#111827">${title}</text>`,
    subtitle
      ? `  <text x="${W / 2}" y="37" text-anchor="middle" font-size="9" fill="#6b7280">${subtitle}</text>`
      : "",
  ]
    .filter(Boolean)
    .join("\n");

  return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" font-family="${FONT_FAMILY}" role="img" aria-label="${ariaLabel}">
  <title>${title}</title>
  ${subtitle ? `<desc>${subtitle}</desc>` : ""}
  <rect width="${W}" height="${H}" fill="#ffffff"/>
${titleLines}
${unitLabel}
  <rect x="${px(plot.left)}" y="${px(plot.top)}" width="${px(plot.width)}" height="${px(plot.height)}" fill="#f9fafb" stroke="#d1d5db" stroke-width="1"/>
${yGridLines.join("\n")}
${zeroLine}
${bars.join("\n")}
${xLabels.join("\n")}
${legendItems.join("\n")}
</svg>`;
}

/** SVG Y 座標 → データ値の逆変換（積み上げ計算用） */
function toSvgYInverse(
  svgY: number,
  rangeLo: number,
  rangeHi: number,
  domainLo: number,
  domainHi: number,
): number {
  return domainLo + ((svgY - rangeLo) / (rangeHi - rangeLo)) * (domainHi - domainLo);
}

// ─── 水平 100% 積み上げ棒グラフ ──────────────────────────────────────────────

function generateHorizontal(
  data: StatsSchema[],
  options: StackedBarOptions,
  normalized: boolean,
): string {
  const { title, subtitle, ariaLabel = title, xKey, seriesKey, unit } = options;

  const xItems = uniqueDimension(data, xKey);
  const series = uniqueDimension(data, seriesKey);
  const valueMap = buildValueMap(data, xKey, seriesKey);

  const BAR_H = 32;
  const BAR_GAP = 10;
  const LABEL_W = 80;
  const LEGEND_H = 36;
  const MARGIN_TOP = 58;
  const MARGIN_BOTTOM = 16 + LEGEND_H;
  const H = MARGIN_TOP + xItems.length * (BAR_H + BAR_GAP) - BAR_GAP + MARGIN_BOTTOM;
  const W = 560;
  const plotLeft = LABEL_W + 4;
  const plotRight = W - 20;
  const plotWidth = plotRight - plotLeft;

  const bars: string[] = [];
  const rowLabels: string[] = [];

  xItems.forEach((x, xi) => {
    const rawVals = series.map((s) => valueMap.get(x.code)?.get(s.code) ?? 0);
    const total = normalized ? rawVals.reduce((a, b) => a + b, 0) : 100;
    const vals = normalized ? rawVals.map((v) => (v / total) * 100) : rawVals;

    const barTop = MARGIN_TOP + xi * (BAR_H + BAR_GAP);
    rowLabels.push(
      `  <text x="${(plotLeft - 6).toFixed(1)}" y="${(barTop + BAR_H / 2 + 4).toFixed(1)}" text-anchor="end" font-size="9.5" fill="#374151">${x.name}</text>`,
    );

    let xCursor = plotLeft;
    series.forEach((s, si) => {
      const pct = vals[si];
      const barW = (pct / 100) * plotWidth;
      if (barW < 1) return;

      const color = STACKED_COLORS[si % STACKED_COLORS.length];
      bars.push(
        `  <rect x="${xCursor.toFixed(1)}" y="${barTop.toFixed(1)}" width="${barW.toFixed(1)}" height="${BAR_H}" fill="${color}" fill-opacity="0.85"/>`,
      );

      if (barW > 28) {
        const label = normalized ? `${rawVals[si].toFixed(1)}%` : `${vals[si].toFixed(1)}%`;
        bars.push(
          `  <text x="${(xCursor + barW / 2).toFixed(1)}" y="${(barTop + BAR_H / 2 + 4).toFixed(1)}" text-anchor="middle" font-size="8.5" fill="#fff">${label}</text>`,
        );
      }
      xCursor += barW;
    });
  });

  // X 軸（0/50/100 のみ）
  const xTicks = normalized ? [0, 25, 50, 75, 100] : [0, 20, 40, 60, 80, 100];
  const xAxis = xTicks.map((v) => {
    const x = plotLeft + (v / 100) * plotWidth;
    const yBottom = MARGIN_TOP + xItems.length * (BAR_H + BAR_GAP) - BAR_GAP;
    return [
      `  <line x1="${x.toFixed(1)}" y1="${MARGIN_TOP}" x2="${x.toFixed(1)}" y2="${yBottom}" stroke="#e5e7eb" stroke-width="1"/>`,
      `  <text x="${x.toFixed(1)}" y="${(yBottom + 12).toFixed(1)}" text-anchor="middle" font-size="8" fill="#9ca3af">${v}%</text>`,
    ].join("\n");
  });

  // 凡例
  const legendY = MARGIN_TOP + xItems.length * (BAR_H + BAR_GAP) - BAR_GAP + 24;
  const legendItems = series.map((s, si) => {
    const lx = plotLeft + si * (plotWidth / series.length);
    const color = STACKED_COLORS[si % STACKED_COLORS.length];
    return [
      `  <rect x="${lx.toFixed(1)}" y="${legendY.toFixed(1)}" width="12" height="10" fill="${color}" fill-opacity="0.85" rx="2"/>`,
      `  <text x="${(lx + 16).toFixed(1)}" y="${(legendY + 8.5).toFixed(1)}" font-size="9" fill="#374151">${s.name}</text>`,
    ].join("\n");
  });

  const unitNote = unit
    ? `  <text x="${(plotRight).toFixed(1)}" y="${(MARGIN_TOP - 6).toFixed(1)}" text-anchor="end" font-size="8.5" fill="#9ca3af">(${unit})</text>`
    : "";

  const titleLines = [
    `  <text x="${W / 2}" y="22" text-anchor="middle" font-size="12.5" font-weight="bold" fill="#111827">${title}</text>`,
    subtitle
      ? `  <text x="${W / 2}" y="37" text-anchor="middle" font-size="9" fill="#6b7280">${subtitle}</text>`
      : "",
  ]
    .filter(Boolean)
    .join("\n");

  return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" font-family="${FONT_FAMILY}" role="img" aria-label="${ariaLabel}">
  <title>${title}</title>
  ${subtitle ? `<desc>${subtitle}</desc>` : ""}
  <rect width="${W}" height="${H}" fill="#ffffff"/>
${titleLines}
${unitNote}
${rowLabels.join("\n")}
${xAxis.join("\n")}
${bars.join("\n")}
${legendItems.join("\n")}
</svg>`;
}
