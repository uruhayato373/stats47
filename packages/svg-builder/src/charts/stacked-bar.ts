import {
  resolveChartDomain,
  stackedNumericValues,
  type NumericDomainPolicy,
} from '@stats47/types';
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

import { FONT_FAMILY, SERIES_COLORS as STACKED_COLORS } from "../shared/color";
import { niceTicks, linearScale, formatTick } from "../shared/axis";
import { makePlotArea, px } from "../shared/layout";
import { layoutLegendRows, planCategoryTicks, rotatedLabelDrop, textWidth } from "../shared/text-metrics";
import { svgThemeStyle } from "../shared/theme";
import {
  StatsSchema,
  DimensionKey,
  uniqueDimension,
  buildValueMap,
} from "../shared/stats-schema";

export interface StackedBarOptions {
  /** 外枠内の描画幅。高さは項目数・凡例の段数から決める。 */
  width?: number;
  showHeading?: boolean;
  domainPolicy?: NumericDomainPolicy;
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
  if (options.width !== undefined && (!Number.isFinite(options.width) || options.width < 300))
    throw new Error("Stacked chart width must be at least 300.");
  const { horizontal = false, normalized = false } = options;
  const finiteValues = data.flatMap(row => typeof row.value === "number" && Number.isFinite(row.value) ? [row.value] : []);
  if (!finiteValues.length) throw new Error("No finite observations for stacked chart");
  if (normalized && finiteValues.some(value => value < 0)) throw new Error("Normalized composition requires nonnegative values");
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

  const W = options.width ?? 680;
  const legend = layoutLegendRows(series.map((s, i) => ({ label: s.name, color: STACKED_COLORS[i % STACKED_COLORS.length] })), { left: 55, availW: W - 55 - 24, fontSize: 9, swatchW: 12, gap: 16 });
  const ticks = planCategoryTicks(xItems.map(x => x.name), (W - 55 - 24) / xItems.length, 9, { angle: 45 });
  const labelDrop = ticks.rotate ? rotatedLabelDrop(Math.max(...xItems.map(x => textWidth(x.name, 9))), 9, 45) : 9;
  const bottom = 14 + labelDrop + 16 + legend.rows * 22;
  const H = 322 + bottom;
  const plot = makePlotArea(W, H, { top: options.showHeading === false ? 14 : 58, right: 24, bottom, left: 55 });

  // 値の計算（正規化 or 生値）
  function getValues(xCode: string): number[] {
    return series.map((s) => valueMap.get(xCode)?.get(s.code) ?? 0);
  }

  const domainRows = xItems.map(x => Object.fromEntries(getValues(x.code).map((value, i) => [String(i), value])));
  const domain = resolveChartDomain(normalized ? [0, 100] : stackedNumericValues(domainRows, series.map((_, i) => String(i))), normalized ? {mode: 'fixed', min: 0, max: 100} : options.domainPolicy ?? {mode: 'zero'});
  if (!domain) throw new Error('No finite observations for stacked chart');
  const [yScaleLo, yScaleHi] = domain;
  const yTicks = niceTicks(yScaleLo, yScaleHi, 5);
  const toSvgY = linearScale(yScaleLo, yScaleHi, plot.bottom, plot.top);

  const barW = Math.min(60, plot.width / xItems.length * 0.75);
  const groupW = plot.width / xItems.length;

  // Y グリッド
  const yGridLines = yTicks.map((v) => {
    const y = px(toSvgY(v));
    return [
      `  <line x1="${px(plot.left)}" y1="${y}" x2="${px(plot.right)}" y2="${y}" class="svg-grid" stroke-width="1"/>`,
      `  <text x="${(plot.left - 5).toFixed(1)}" y="${(toSvgY(v) + 3.5).toFixed(1)}" text-anchor="end" font-size="8.5" class="svg-tick">${formatTick(v)}</text>`,
    ].join("\n");
  });

  // ゼロライン
  const zeroY = toSvgY(0);
  const zeroLine =
    yScaleLo < 0
      ? `  <line x1="${px(plot.left)}" y1="${px(zeroY)}" x2="${px(plot.right)}" y2="${px(zeroY)}" stroke="#6b7280" stroke-width="1.5"/>`
      : "";

  // 棒の描画（負値は 0 から下方向、正値は 0 から上方向に積む）
  const bars: string[] = [];
  const xLabels: string[] = [];

  xItems.forEach((x, xi) => {
    const cx = plot.left + groupW * xi + groupW / 2;
    if (ticks.indices.includes(xi)) {
      const y = plot.bottom + 14;
      const transform = ticks.rotate ? ` transform="rotate(-45,${px(cx)},${px(y)})"` : "";
      xLabels.push(`  <text x="${px(cx)}" y="${px(y)}" text-anchor="${ticks.rotate ? "end" : "middle"}" font-size="9" class="svg-tick"${transform}>${x.name}</text>`);
    }

    const rawVals = getValues(x.code);
    const totalPos = normalized ? rawVals.filter((v) => v > 0).reduce((a, b) => a + b, 0) : 1;

    let posTop = zeroY;
    let negBottom = zeroY;

    // 100% 積み上げは縦軸が構成比なので、棒の中も構成比で示す (生値だと軸と単位が食い違う)
    const segmentLabel = (raw: number, v: number) =>
      normalized ? `${v.toFixed(1)}%` : formatTick(Math.abs(raw));

    series.forEach((s, si) => {
      const raw = valueMap.get(x.code)?.get(s.code) ?? 0;
      const v = normalized ? (totalPos ? raw / totalPos : 0) * 100 : raw;
      if (v === 0) return;

      const color = STACKED_COLORS[si % STACKED_COLORS.length];
      const barLeft = cx - barW / 2;

      if (v > 0) {
        const top = toSvgY(toSvgYInverse(posTop, plot.bottom, plot.top, yScaleLo, yScaleHi) + v);
        const h = Math.abs(posTop - top);
        bars.push(
          `  <rect x="${barLeft.toFixed(1)}" y="${top.toFixed(1)}" width="${barW.toFixed(1)}" height="${h.toFixed(1)}" fill="${color}" fill-opacity="0.85"/>`,
        );
        if (h > 12 && textWidth(segmentLabel(raw, v), 7.5) + 4 <= barW) {
          bars.push(
            `  <text x="${cx.toFixed(1)}" y="${(top + h / 2 + 3.5).toFixed(1)}" text-anchor="middle" font-size="7.5" fill="#fff">${segmentLabel(raw, v)}</text>`,
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
        if (h > 12 && textWidth(segmentLabel(raw, v), 7.5) + 4 <= barW) {
          bars.push(
            `  <text x="${cx.toFixed(1)}" y="${(negBottom + h / 2 + 3.5).toFixed(1)}" text-anchor="middle" font-size="7.5" fill="#fff">${segmentLabel(raw, v)}</text>`,
          );
        }
        negBottom = bottom;
      }
    });
  });

  // 文字幅で折り返し、回転した軸ラベルの下に置く。
  const legendY = plot.bottom + 14 + labelDrop + 12;
  const legendItems = legend.items.map(({ x: lx, row, label, color }) => {
    const ly = legendY + row * 22;
    return `  <rect x="${px(lx)}" y="${px(ly)}" width="12" height="10" fill="${color}" fill-opacity="0.85" rx="2"/>
  <text x="${px(lx + 16)}" y="${px(ly + 8.5)}" font-size="9" class="svg-axis">${label}</text>`;
  });

  const unitLabel = unit
    ? `  <text x="${px(plot.left)}" y="${(plot.top - 6).toFixed(1)}" font-size="8.5" class="svg-tick">(${unit})</text>`
    : "";

  const titleLines = [
    `  <text x="${W / 2}" y="22" text-anchor="middle" font-size="12.5" font-weight="bold" class="svg-title">${title}</text>`,
    subtitle
      ? `  <text x="${W / 2}" y="37" text-anchor="middle" font-size="9" class="svg-tick">${subtitle}</text>`
      : "",
  ]
    .filter(Boolean)
    .join("\n");

  return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" font-family="${FONT_FAMILY}" role="img" aria-label="${ariaLabel}">
  <title>${title}</title>
  ${subtitle ? `<desc>${subtitle}</desc>` : ""}
${svgThemeStyle()}
  <rect width="${W}" height="${H}" class="svg-bg"/>
${options.showHeading === false ? "" : titleLines}
${unitLabel}
  <rect x="${px(plot.left)}" y="${px(plot.top)}" width="${px(plot.width)}" height="${px(plot.height)}" class="svg-plot svg-plot-border" stroke-width="1"/>
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
  const MARGIN_TOP = options.showHeading === false ? 14 : 58;
  const W = options.width ?? 680;
  const plotLeft = LABEL_W + 4;
  const plotRight = W - 20;
  const plotWidth = plotRight - plotLeft;

  const legend = layoutLegendRows(series.map((s, i) => ({ label: s.name, color: STACKED_COLORS[i % STACKED_COLORS.length] })), { left: plotLeft, availW: plotWidth, fontSize: 9, swatchW: 12, gap: 16 });
  const H = MARGIN_TOP + xItems.length * (BAR_H + BAR_GAP) - BAR_GAP + 32 + legend.rows * 22;

  const horizontalRows = xItems.map(x => Object.fromEntries(series.map(s => [s.code, valueMap.get(x.code)?.get(s.code)])));
  if (data.some(row => row.value !== null && row.value < 0)) throw new Error('Horizontal composition requires nonnegative values');
  const compositionPolicy = {mode: 'fixed', min: 0, max: 100} as const;
  if (options.domainPolicy && (options.domainPolicy.mode !== 'fixed' || options.domainPolicy.min !== 0 || options.domainPolicy.max !== 100)) throw new Error('Horizontal composition requires domain 0–100');
  resolveChartDomain(normalized ? [0,100] : stackedNumericValues(horizontalRows, series.map(s=>s.code)), compositionPolicy);
  const bars: string[] = [];
  const rowLabels: string[] = [];

  xItems.forEach((x, xi) => {
    const rawVals = series.map((s) => valueMap.get(x.code)?.get(s.code) ?? 0);
    const total = normalized ? rawVals.reduce((a, b) => a + b, 0) : 100;
    const vals = normalized ? rawVals.map((v) => (total ? v / total : 0) * 100) : rawVals;

    const barTop = MARGIN_TOP + xi * (BAR_H + BAR_GAP);
    rowLabels.push(
      `  <text x="${(plotLeft - 6).toFixed(1)}" y="${(barTop + BAR_H / 2 + 4).toFixed(1)}" text-anchor="end" font-size="9.5" class="svg-axis">${x.name}</text>`,
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
        // vals は normalized のとき構成比、そうでないときは入力そのもの (横向きは構成比の入力を前提にする)。
        // 2026-10-07 まで normalized で生値に % を付けて「7347.0%」と出していた
        const label = `${vals[si].toFixed(1)}%`;
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
      `  <line x1="${x.toFixed(1)}" y1="${MARGIN_TOP}" x2="${x.toFixed(1)}" y2="${yBottom}" class="svg-grid" stroke-width="1"/>`,
      `  <text x="${x.toFixed(1)}" y="${(yBottom + 12).toFixed(1)}" text-anchor="middle" font-size="8" class="svg-tick">${v}%</text>`,
    ].join("\n");
  });

  const legendY = MARGIN_TOP + xItems.length * (BAR_H + BAR_GAP) - BAR_GAP + 24;
  const legendItems = legend.items.map(({ x: lx, row, label, color }) => {
    const ly = legendY + row * 22;
    return `  <rect x="${px(lx)}" y="${px(ly)}" width="12" height="10" fill="${color}" fill-opacity="0.85" rx="2"/>
  <text x="${px(lx + 16)}" y="${px(ly + 8.5)}" font-size="9" class="svg-axis">${label}</text>`;
  });

  const unitNote = unit
    ? `  <text x="${(plotRight).toFixed(1)}" y="${(MARGIN_TOP - 6).toFixed(1)}" text-anchor="end" font-size="8.5" class="svg-tick">(${unit})</text>`
    : "";

  const titleLines = [
    `  <text x="${W / 2}" y="22" text-anchor="middle" font-size="12.5" font-weight="bold" class="svg-title">${title}</text>`,
    subtitle
      ? `  <text x="${W / 2}" y="37" text-anchor="middle" font-size="9" class="svg-tick">${subtitle}</text>`
      : "",
  ]
    .filter(Boolean)
    .join("\n");

  return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" font-family="${FONT_FAMILY}" role="img" aria-label="${ariaLabel}">
  <title>${title}</title>
  ${subtitle ? `<desc>${subtitle}</desc>` : ""}
${svgThemeStyle()}
  <rect width="${W}" height="${H}" class="svg-bg"/>
${options.showHeading === false ? "" : titleLines}
${unitNote}
${rowLabels.join("\n")}
${xAxis.join("\n")}
${bars.join("\n")}
${legendItems.join("\n")}
</svg>`;
}
