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
 * ## 使い方（水平 100% 積み上げ・基準線・スマホ用）
 * ```ts
 * const svg = generateStackedBarSvg(data, {
 *   title: "年齢階級別 仕事内容 vs 賃金",
 *   xKey: "areaCode",
 *   seriesKey: "categoryCode",
 *   unit: "%",
 *   horizontal: true,
 *   normalized: true,
 *   referenceLine: { value: 26.6, label: "全国平均 26.6%" },
 *   layout: "mobile",
 * });
 * ```
 *
 * ## 狭い区分の値
 * 棒の中に値が収まらない区分は、その棒の別の区分に値が出ているときに限り、棒の外の注記
 * (横向きは棒の直下、縦向きは凡例の下) に「区分名 値」で出す。どの区分も収まらない細い棒
 * (47 都道府県を並べた縦棒など) は、値を読ませる図ではないので注記しない。
 * 2026-10-07 に北海道のシェアの図で採卵鶏の 3.5% が図のどこにも出なかった (BLOG-STACKED-BAR-LABEL-MOBILE-01)。
 */

import { FONT_FAMILY, SERIES_COLORS as STACKED_COLORS } from "../shared/color";
import { niceTicks, linearScale, formatTick } from "../shared/axis";
import { px } from "../shared/layout";
import { layoutLegendRows, planCategoryTicks, rotatedLabelDrop, textWidth } from "../shared/text-metrics";
import { svgThemeStyle } from "../shared/theme";
import {
  StatsSchema,
  DimensionKey,
  uniqueDimension,
  buildValueMap,
} from "../shared/stats-schema";

/** 比べる基準の線 (例: 全国平均)。値は縦軸 (横向きは横軸) と同じ単位で書く。 */
export interface StackedBarReferenceLine {
  value: number;
  /** 線の説明 (例: "全国平均 26.6%")。図の中にこのまま出す。 */
  label: string;
}

export interface StackedBarOptions {
  /** 外枠内の描画幅。高さは項目数・凡例の段数から決める。layout "mobile" では無視する (640 固定)。 */
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
  /** 比べる基準の線。横向きは縦線 (0〜100%)、縦向きは横線 (縦軸の範囲内)。 */
  referenceLine?: StackedBarReferenceLine;
  /**
   * "mobile" はブログのスマホ本文・note 本文用。幅 640 で、最小の文字を 20px 以上にする
   * (横長の図を CSS で縮めると 390px 幅で 4px 台の文字になる)。横向きは区分名を棒の上に置き、棒を全幅で描く。
   */
  layout?: "default" | "mobile";
}

/** スマホ用の幅。ランキングの本文縦長カード (bar-chart の mobile) と同じ 640。 */
export const STACKED_MOBILE_WIDTH = 640;
/** スマホ用で最も小さい文字 (desktop の 7.5px) を 20px にする倍率。 */
const MOBILE_SCALE = 20 / 7.5;

interface Frame {
  k: number;
  mobile: boolean;
  W: number;
}

function frameOf(options: StackedBarOptions): Frame {
  if (options.layout === "mobile") return { k: MOBILE_SCALE, mobile: true, W: STACKED_MOBILE_WIDTH };
  return { k: 1, mobile: false, W: options.width ?? 680 };
}

const r1 = (n: number) => Math.round(n * 10) / 10;

/** 文字幅で行を折り返す。maxLines を超えたら例外 (文字を縮めて詰め込まない)。 */
function wrapText(text: string, maxW: number, fontSize: number, maxLines: number): string[] {
  const lines: string[] = [];
  let cur = "";
  for (const ch of [...text]) {
    if (cur && textWidth(cur + ch, fontSize) > maxW) {
      lines.push(cur);
      cur = "";
    }
    cur += ch;
  }
  if (cur) lines.push(cur);
  if (lines.length > maxLines) throw new Error(`Stacked chart copy "${text}" exceeds ${maxLines} lines; shorten it.`);
  return lines;
}

/** 見出し (タイトル・副題) の SVG と、見出しが使った高さ。 */
function headingBlock(options: StackedBarOptions, f: Frame): { svg: string; bottom: number } {
  const { title, subtitle } = options;
  if (options.showHeading === false) return { svg: "", bottom: 0 };
  if (!f.mobile) {
    const lines = [
      `  <text x="${f.W / 2}" y="22" text-anchor="middle" font-size="12.5" font-weight="bold" class="svg-title">${title}</text>`,
      subtitle ? `  <text x="${f.W / 2}" y="37" text-anchor="middle" font-size="9" class="svg-tick">${subtitle}</text>` : "",
    ];
    return { svg: lines.filter(Boolean).join("\n"), bottom: 44 };
  }
  const titleF = r1(12.5 * f.k);
  const subF = r1(9 * f.k);
  const maxW = f.W - 48;
  const out: string[] = [];
  let y = 12;
  for (const line of wrapText(title, maxW, titleF, 2)) {
    y += titleF * 1.25;
    out.push(`  <text x="24" y="${px(y)}" font-size="${titleF}" font-weight="bold" class="svg-title">${line}</text>`);
  }
  if (subtitle) {
    y += 4;
    for (const line of wrapText(subtitle, maxW, subF, 2)) {
      y += subF * 1.3;
      out.push(`  <text x="24" y="${px(y)}" font-size="${subF}" class="svg-tick">${line}</text>`);
    }
  }
  return { svg: out.join("\n"), bottom: y + 8 };
}

function validateReferenceLine(ref: StackedBarReferenceLine | undefined, lo: number, hi: number): void {
  if (!ref) return;
  if (!Number.isFinite(ref.value) || ref.value < lo || ref.value > hi)
    throw new Error(`Reference line ${ref.value} is outside the axis range ${lo}–${hi}.`);
  if (!String(ref.label ?? "").trim()) throw new Error("Reference line needs a label.");
}

interface NoteEntry {
  label: string;
  color: string;
}

/** 棒の外に出す注記 (色チップ + 「区分名 値」) を折り返して並べる。 */
function noteChips(entries: NoteEntry[], left: number, availW: number, top: number, f: Frame): { svg: string[]; height: number } {
  if (!entries.length) return { svg: [], height: 0 };
  const noteF = r1(8.5 * f.k);
  const chip = r1(8 * f.k);
  const lineH = noteF * 1.6;
  const layout = layoutLegendRows(entries, { left, availW, fontSize: noteF, swatchW: chip, gap: r1(12 * f.k), align: "left" });
  const svg = layout.items.map(({ x, row, label, color }) => {
    const y = top + row * lineH;
    return `  <rect x="${px(x)}" y="${px(y + (lineH - chip) / 2 - noteF * 0.3)}" width="${chip}" height="${chip}" fill="${color}" fill-opacity="0.85" rx="1"/>
  <text x="${px(x + chip + 4)}" y="${px(y + lineH / 2 + noteF * 0.05)}" font-size="${noteF}" class="svg-axis">${label}</text>`;
  });
  return { svg, height: layout.rows * lineH };
}

export function generateStackedBarSvg(data: StatsSchema[], options: StackedBarOptions): string {
  if (options.layout !== "mobile" && options.width !== undefined && (!Number.isFinite(options.width) || options.width < 300))
    throw new Error("Stacked chart width must be at least 300.");
  const { horizontal = false, normalized = false } = options;
  const finiteValues = data.flatMap(row => typeof row.value === "number" && Number.isFinite(row.value) ? [row.value] : []);
  if (!finiteValues.length) throw new Error("No finite observations for stacked chart");
  if (normalized && finiteValues.some(value => value < 0)) throw new Error("Normalized composition requires nonnegative values");
  const f = frameOf(options);
  return horizontal
    ? generateHorizontal(data, options, normalized, f)
    : generateVertical(data, options, normalized, f);
}

function svgShell(options: StackedBarOptions, f: Frame, H: number, heading: string, body: string[]): string {
  const { title, subtitle, ariaLabel = title } = options;
  const h = Math.ceil(H);
  return `<svg width="${f.W}" height="${h}" viewBox="0 0 ${f.W} ${h}" xmlns="http://www.w3.org/2000/svg" font-family="${FONT_FAMILY}" role="img" aria-label="${ariaLabel}">
  <title>${title}</title>
  ${subtitle ? `<desc>${subtitle}</desc>` : ""}
${svgThemeStyle()}
  <rect width="${f.W}" height="${h}" class="svg-bg"/>
${heading}
${body.filter(Boolean).join("\n")}
</svg>`;
}

// ─── 垂直積み上げ棒グラフ ────────────────────────────────────────────────────

function generateVertical(
  data: StatsSchema[],
  options: StackedBarOptions,
  normalized: boolean,
  f: Frame,
): string {
  const { xKey, seriesKey, unit } = options;
  const { k, W } = f;

  const xItems = uniqueDimension(data, xKey);
  const series = uniqueDimension(data, seriesKey);
  const valueMap = buildValueMap(data, xKey, seriesKey);

  // 値の計算（正規化 or 生値）
  function getValues(xCode: string): number[] {
    return series.map((s) => valueMap.get(xCode)?.get(s.code) ?? 0);
  }

  const domainRows = xItems.map(x => Object.fromEntries(getValues(x.code).map((value, i) => [String(i), value])));
  const domain = resolveChartDomain(normalized ? [0, 100] : stackedNumericValues(domainRows, series.map((_, i) => String(i))), normalized ? {mode: 'fixed', min: 0, max: 100} : options.domainPolicy ?? {mode: 'zero'});
  if (!domain) throw new Error('No finite observations for stacked chart');
  const [yScaleLo, yScaleHi] = domain;
  validateReferenceLine(options.referenceLine, yScaleLo, yScaleHi);
  const yTicks = niceTicks(yScaleLo, yScaleHi, 5);

  const tickF = r1(8.5 * k);
  const axisF = r1(9 * k);
  const segF = r1(7.5 * k);
  const legendF = r1(9 * k);
  const swatchW = r1(12 * k);
  const swatchH = r1(10 * k);
  const legendLineH = 22 * k;
  const right = 24;
  const left = f.mobile ? Math.ceil(Math.max(...yTicks.map((v) => textWidth(formatTick(v), tickF))) + 12) : 55;
  const heading = headingBlock(options, f);
  const top = options.showHeading === false ? 14 * k : f.mobile ? heading.bottom + tickF + 14 : 58;
  // desktop は従来どおりプロットの下端を y=322 に置く (高さはプロット下の要素で決まる)
  const plotBottom = f.mobile ? top + 520 : 322;
  const plot = { left, right: W - right, top, bottom: plotBottom, width: W - right - left, height: plotBottom - top };

  const legend = layoutLegendRows(series.map((s, i) => ({ label: s.name, color: STACKED_COLORS[i % STACKED_COLORS.length] })), { left, availW: W - left - right, fontSize: legendF, swatchW, gap: 16 * k });
  const ticks = planCategoryTicks(xItems.map(x => x.name), plot.width / xItems.length, axisF, { angle: 45 });
  const labelDrop = ticks.rotate ? rotatedLabelDrop(Math.max(...xItems.map(x => textWidth(x.name, axisF))), axisF, 45) : axisF;
  const toSvgY = linearScale(yScaleLo, yScaleHi, plot.bottom, plot.top);

  const barW = Math.min(60 * k, plot.width / xItems.length * 0.75);
  const groupW = plot.width / xItems.length;

  // Y グリッド
  const yGridLines = yTicks.map((v) => {
    const y = px(toSvgY(v));
    return [
      `  <line x1="${px(plot.left)}" y1="${y}" x2="${px(plot.right)}" y2="${y}" class="svg-grid" stroke-width="1"/>`,
      `  <text x="${(plot.left - 5).toFixed(1)}" y="${(toSvgY(v) + 3.5 * k).toFixed(1)}" text-anchor="end" font-size="${tickF}" class="svg-tick">${formatTick(v)}</text>`,
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
  const notes: NoteEntry[] = [];

  // 100% 積み上げは縦軸が構成比なので、棒の中も構成比で示す (生値だと軸と単位が食い違う)
  const segmentLabel = (raw: number, v: number) =>
    normalized ? `${v.toFixed(1)}%` : formatTick(Math.abs(raw));

  xItems.forEach((x, xi) => {
    const cx = plot.left + groupW * xi + groupW / 2;
    if (ticks.indices.includes(xi)) {
      const y = plot.bottom + 14 * k;
      const transform = ticks.rotate ? ` transform="rotate(-45,${px(cx)},${px(y)})"` : "";
      xLabels.push(`  <text x="${px(cx)}" y="${px(y)}" text-anchor="${ticks.rotate ? "end" : "middle"}" font-size="${axisF}" class="svg-tick"${transform}>${x.name}</text>`);
    }

    const rawVals = getValues(x.code);
    const totalPos = normalized ? rawVals.filter((v) => v > 0).reduce((a, b) => a + b, 0) : 1;

    let posTop = zeroY;
    let negBottom = zeroY;
    const narrow: NoteEntry[] = [];
    let labeledInside = 0;

    series.forEach((s, si) => {
      const raw = valueMap.get(x.code)?.get(s.code) ?? 0;
      const v = normalized ? (totalPos ? raw / totalPos : 0) * 100 : raw;
      if (v === 0) return;

      const color = STACKED_COLORS[si % STACKED_COLORS.length];
      const barLeft = cx - barW / 2;
      const label = segmentLabel(raw, v);
      const fits = (h: number) => h > 12 * k && textWidth(label, segF) + 4 <= barW;

      if (v > 0) {
        const top = toSvgY(toSvgYInverse(posTop, plot.bottom, plot.top, yScaleLo, yScaleHi) + v);
        const h = Math.abs(posTop - top);
        bars.push(
          `  <rect x="${barLeft.toFixed(1)}" y="${top.toFixed(1)}" width="${barW.toFixed(1)}" height="${h.toFixed(1)}" fill="${color}" fill-opacity="0.85"/>`,
        );
        if (fits(h)) {
          labeledInside++;
          bars.push(
            `  <text x="${cx.toFixed(1)}" y="${(top + h / 2 + 3.5 * k).toFixed(1)}" text-anchor="middle" font-size="${segF}" fill="#fff">${label}</text>`,
          );
        } else narrow.push({ label: `${xItems.length > 1 ? `${x.name}・` : ""}${s.name} ${label}`, color });
        posTop = top;
      } else {
        const bottom = toSvgY(
          toSvgYInverse(negBottom, plot.bottom, plot.top, yScaleLo, yScaleHi) + v,
        );
        const h = Math.abs(bottom - negBottom);
        bars.push(
          `  <rect x="${barLeft.toFixed(1)}" y="${negBottom.toFixed(1)}" width="${barW.toFixed(1)}" height="${h.toFixed(1)}" fill="${color}" fill-opacity="0.85"/>`,
        );
        if (fits(h)) {
          labeledInside++;
          bars.push(
            `  <text x="${cx.toFixed(1)}" y="${(negBottom + h / 2 + 3.5 * k).toFixed(1)}" text-anchor="middle" font-size="${segF}" fill="#fff">${label}</text>`,
          );
        } else narrow.push({ label: `${xItems.length > 1 ? `${x.name}・` : ""}${s.name} -${label}`, color });
        negBottom = bottom;
      }
    });
    // 同じ棒の別の区分に値が出ているときだけ、収まらなかった区分を棒の外へ出す
    if (labeledInside > 0) notes.push(...narrow);
  });

  // 基準線 (横線)。説明はプロットの右上に置き、線と同じ破線の見本を添える
  const ref = options.referenceLine;
  const refSvg: string[] = [];
  if (ref) {
    const y = px(toSvgY(ref.value));
    const refF = tickF;
    const labelW = textWidth(ref.label, refF);
    const sampleW = 16 * k;
    const lx = plot.right - labelW;
    const ly = plot.top - 6 * k;
    refSvg.push(
      `  <line x1="${px(plot.left)}" y1="${y}" x2="${px(plot.right)}" y2="${y}" stroke="#111827" stroke-width="${r1(1.5 * k)}" stroke-dasharray="${r1(5 * k)} ${r1(3 * k)}"/>`,
      `  <line x1="${px(lx - sampleW - 4)}" y1="${px(ly - refF * 0.35)}" x2="${px(lx - 4)}" y2="${px(ly - refF * 0.35)}" stroke="#111827" stroke-width="${r1(1.5 * k)}" stroke-dasharray="${r1(5 * k)} ${r1(3 * k)}"/>`,
      `  <text x="${px(plot.right)}" y="${px(ly)}" text-anchor="end" font-size="${refF}" class="svg-axis">${ref.label}</text>`,
    );
  }

  // 文字幅で折り返し、回転した軸ラベルの下に置く。
  const legendY = plot.bottom + 14 * k + labelDrop + 12 * k;
  const legendItems = legend.items.map(({ x: lx, row, label, color }) => {
    const ly = legendY + row * legendLineH;
    return `  <rect x="${px(lx)}" y="${px(ly)}" width="${swatchW}" height="${swatchH}" fill="${color}" fill-opacity="0.85" rx="2"/>
  <text x="${px(lx + swatchW + 4)}" y="${px(ly + 8.5 * k)}" font-size="${legendF}" class="svg-axis">${label}</text>`;
  });
  const legendBottom = legendY + legend.rows * legendLineH;
  const noteBlock = noteChips(notes, plot.left, plot.width, legendBottom + 4 * k, f);
  const H = legendBottom + 4 * k + (noteBlock.height ? noteBlock.height + 8 * k : 0) + (f.mobile ? 16 : 0);

  const unitLabel = unit
    ? `  <text x="${px(plot.left)}" y="${(plot.top - 6 * k).toFixed(1)}" font-size="${tickF}" class="svg-tick">(${unit})</text>`
    : "";

  return svgShell(options, f, H, heading.svg, [
    unitLabel,
    `  <rect x="${px(plot.left)}" y="${px(plot.top)}" width="${px(plot.width)}" height="${px(plot.height)}" class="svg-plot svg-plot-border" stroke-width="1"/>`,
    yGridLines.join("\n"),
    zeroLine,
    bars.join("\n"),
    refSvg.join("\n"),
    xLabels.join("\n"),
    legendItems.join("\n"),
    noteBlock.svg.join("\n"),
  ]);
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
  f: Frame,
): string {
  const { xKey, seriesKey, unit } = options;
  const { k, W, mobile } = f;

  const xItems = uniqueDimension(data, xKey);
  const series = uniqueDimension(data, seriesKey);
  const valueMap = buildValueMap(data, xKey, seriesKey);

  // desktop は区分名を棒の左に、mobile は棒の上に置いて棒を全幅で描く
  const BAR_H = mobile ? 48 : 32;
  const BAR_GAP = mobile ? 18 : 10;
  const LABEL_W = 80;
  const rowLabelF = r1(9.5 * k);
  const segF = r1(8.5 * k);
  const tickF = r1(8 * k);
  const legendF = r1(9 * k);
  const swatchW = r1(12 * k);
  const swatchH = r1(10 * k);
  const legendLineH = 22 * k;
  const heading = headingBlock(options, f);
  const MARGIN_TOP = options.showHeading === false ? 14 * k : mobile ? heading.bottom + tickF + 14 : 58;
  const plotLeft = mobile ? 24 : LABEL_W + 4;
  const plotRight = W - (mobile ? 24 : 20);
  const plotWidth = plotRight - plotLeft;

  const legend = layoutLegendRows(series.map((s, i) => ({ label: s.name, color: STACKED_COLORS[i % STACKED_COLORS.length] })), { left: plotLeft, availW: plotWidth, fontSize: legendF, swatchW, gap: 16 * k });

  const horizontalRows = xItems.map(x => Object.fromEntries(series.map(s => [s.code, valueMap.get(x.code)?.get(s.code)])));
  if (data.some(row => row.value !== null && row.value < 0)) throw new Error('Horizontal composition requires nonnegative values');
  const compositionPolicy = {mode: 'fixed', min: 0, max: 100} as const;
  if (options.domainPolicy && (options.domainPolicy.mode !== 'fixed' || options.domainPolicy.min !== 0 || options.domainPolicy.max !== 100)) throw new Error('Horizontal composition requires domain 0–100');
  resolveChartDomain(normalized ? [0,100] : stackedNumericValues(horizontalRows, series.map(s=>s.code)), compositionPolicy);
  validateReferenceLine(options.referenceLine, 0, 100);
  const bars: string[] = [];
  const rowLabels: string[] = [];
  const noteSvg: string[] = [];

  let cursor = MARGIN_TOP;
  let firstBarTop = MARGIN_TOP;
  const barSpans: number[] = [];
  xItems.forEach((x, xi) => {
    const rawVals = series.map((s) => valueMap.get(x.code)?.get(s.code) ?? 0);
    const total = normalized ? rawVals.reduce((a, b) => a + b, 0) : 100;
    const vals = normalized ? rawVals.map((v) => (total ? v / total : 0) * 100) : rawVals;

    if (mobile) {
      cursor += rowLabelF * 1.2;
      rowLabels.push(`  <text x="${px(plotLeft)}" y="${px(cursor)}" font-size="${rowLabelF}" class="svg-axis">${x.name}</text>`);
      cursor += rowLabelF * 0.4;
    }
    const barTop = cursor;
    if (xi === 0) firstBarTop = barTop;
    if (!mobile) {
      rowLabels.push(
        `  <text x="${(plotLeft - 6).toFixed(1)}" y="${(barTop + BAR_H / 2 + 4).toFixed(1)}" text-anchor="end" font-size="${rowLabelF}" class="svg-axis">${x.name}</text>`,
      );
    }

    let xCursor = plotLeft;
    const narrow: NoteEntry[] = [];
    let labeledInside = 0;
    series.forEach((s, si) => {
      const pct = vals[si];
      const barW = (pct / 100) * plotWidth;
      const color = STACKED_COLORS[si % STACKED_COLORS.length];
      // vals は normalized のとき構成比、そうでないときは入力そのもの (横向きは構成比の入力を前提にする)。
      // 2026-10-07 まで normalized で生値に % を付けて「7347.0%」と出していた
      const label = `${pct.toFixed(1)}%`;
      if (barW < 1) {
        if (pct > 0) narrow.push({ label: `${s.name} ${label}`, color });
        return;
      }
      bars.push(
        `  <rect x="${xCursor.toFixed(1)}" y="${barTop.toFixed(1)}" width="${barW.toFixed(1)}" height="${BAR_H}" fill="${color}" fill-opacity="0.85"/>`,
      );
      if (textWidth(label, segF) + 4 < barW) {
        labeledInside++;
        bars.push(
          `  <text x="${(xCursor + barW / 2).toFixed(1)}" y="${(barTop + BAR_H / 2 + 4 * k).toFixed(1)}" text-anchor="middle" font-size="${segF}" fill="#fff">${label}</text>`,
        );
      } else narrow.push({ label: `${s.name} ${label}`, color });
      xCursor += barW;
    });
    cursor = barTop + BAR_H;
    barSpans.push(barTop);
    // 同じ棒の別の区分に値が出ているときだけ、収まらなかった区分を棒の直下に出す
    if (labeledInside > 0 && narrow.length) {
      const block = noteChips(narrow, plotLeft, plotWidth, cursor + 3 * k, f);
      noteSvg.push(...block.svg);
      cursor += block.height + 3 * k;
    }
    cursor += BAR_GAP;
  });
  const yBottom = cursor - BAR_GAP;

  // X 軸（0/50/100 のみ）
  const xTicks = normalized ? [0, 25, 50, 75, 100] : [0, 20, 40, 60, 80, 100];
  const xAxis = xTicks.map((v) => {
    const x = plotLeft + (v / 100) * plotWidth;
    const anchor = mobile && v === 0 ? "start" : mobile && v === 100 ? "end" : "middle";
    return [
      `  <line x1="${x.toFixed(1)}" y1="${r1(firstBarTop)}" x2="${x.toFixed(1)}" y2="${r1(yBottom)}" class="svg-grid" stroke-width="1"/>`,
      `  <text x="${x.toFixed(1)}" y="${(yBottom + 4 + tickF).toFixed(1)}" text-anchor="${anchor}" font-size="${tickF}" class="svg-tick">${v}%</text>`,
    ].join("\n");
  });

  // 基準線 (縦線)。線は棒の上だけに引き (棒の外の注記を横切らない)、説明は目盛りの下の 1 行に
  // 線と同じ破線の見本を添えて置く (目盛り・凡例と重ねない)
  const ref = options.referenceLine;
  const refSvg: string[] = [];
  let refH = 0;
  if (ref) {
    const x = plotLeft + (ref.value / 100) * plotWidth;
    const refF = tickF;
    const dash = `stroke="#111827" stroke-width="${r1(1.5 * k)}" stroke-dasharray="${r1(5 * k)} ${r1(3 * k)}"`;
    for (const top of barSpans) {
      refSvg.push(`  <line x1="${px(x)}" y1="${px(top - 3 * k)}" x2="${px(x)}" y2="${px(top + BAR_H + 3 * k)}" ${dash}/>`);
    }
    const sampleW = 16 * k;
    const blockW = sampleW + 4 + textWidth(ref.label, refF);
    const bx = Math.min(Math.max(x - blockW / 2, plotLeft), plotRight - blockW);
    const ly = yBottom + 4 + tickF + 6 * k + refF;
    refSvg.push(
      `  <line x1="${px(bx)}" y1="${px(ly - refF * 0.35)}" x2="${px(bx + sampleW)}" y2="${px(ly - refF * 0.35)}" ${dash}/>`,
      `  <text x="${px(bx + sampleW + 4)}" y="${px(ly)}" font-size="${refF}" class="svg-axis">${ref.label}</text>`,
    );
    refH = 6 * k + refF + 2;
  }

  const legendY = yBottom + 24 * k + refH;
  const legendItems = legend.items.map(({ x: lx, row, label, color }) => {
    const ly = legendY + row * legendLineH;
    return `  <rect x="${px(lx)}" y="${px(ly)}" width="${swatchW}" height="${swatchH}" fill="${color}" fill-opacity="0.85" rx="2"/>
  <text x="${px(lx + swatchW + 4)}" y="${px(ly + 8.5 * k)}" font-size="${legendF}" class="svg-axis">${label}</text>`;
  });
  const H = legendY + 8 * k + legend.rows * legendLineH + (mobile ? 16 : 0);

  const unitNote = unit
    ? `  <text x="${(plotRight).toFixed(1)}" y="${(MARGIN_TOP - 6 * k).toFixed(1)}" text-anchor="end" font-size="${r1(8.5 * k)}" class="svg-tick">(${unit})</text>`
    : "";

  return svgShell(options, f, H, heading.svg, [
    unitNote,
    rowLabels.join("\n"),
    xAxis.join("\n"),
    bars.join("\n"),
    noteSvg.join("\n"),
    refSvg.join("\n"),
    legendItems.join("\n"),
  ]);
}
