/**
 * 横棒グラフ SVG 生成
 *
 * ランキング上位・下位N件の水平バーチャートを静的 SVG 文字列として出力する。
 *
 * ## layout の使い方
 * - "single"（デフォルト）: 上位N件 → セパレーター → 下位N件 を縦1列で描画。viewBox 幅 680。
 * - "columns": セパレーター位置で分割し、上位を左カラム・下位を右カラムに並列表示。viewBox 幅 960。
 *
 * ## セパレーターの使い方
 * isSeparator: true のアイテムを挿入すると、"single" では破線と「…中略…」を描画、
 * "columns" では左右の分割点として使用する。
 *
 * ```ts
 * import { toSplitItems } from "../shared/stats-schema";
 * const items = toSplitItems(data, 5, 5);
 * const svg = generateBarChartSvg(items, { title: "...", unit: "件", layout: "columns" });
 * ```
 *
 * ## xMin の使い方
 * X 軸を 0 以外から始めたい場合に指定する（例: 保険普及率 20〜60%）。
 * "single" レイアウトのみ対応。
 */

import { niceScale, formatTick } from "../shared/axis";
import { FONT_FAMILY, PALETTES, PaletteName, colorByIndex } from "../shared/color";
import { svgThemeStyle } from "../shared/theme";

export interface BarItem {
  /** 表示ラベル（例: "1位 徳島"） */
  label: string;
  /** 数値 */
  value: number;
  /**
   * true のとき、バーを描画せず破線と「…中略…」を表示する区切り行にする（"single" レイアウト）、
   * または "columns" レイアウトで左右の分割点として使用する。
   */
  isSeparator?: boolean;
}

export interface BarChartOptions {
  /** チャートタイトル */
  title: string;
  /**
   * サブタイトル（年度・単位の説明など）。
   * タイトルと同じ行に小さいグレー文字で表示する（tspan）。
   */
  subtitle?: string;
  /** X 軸ラベル（showAxis: true のときのみ描画） */
  unit: string;
  /** aria-label */
  ariaLabel?: string;
  /** カラーパレット名。デフォルト: "red" */
  palette?: PaletteName;
  /** パレットの代わりにインデックス→色の関数を渡す場合 */
  colorFn?: (index: number) => string;
  /**
   * レイアウト。デフォルト: "single"。
   * - "single": セパレーターを中略行として縦1列表示（viewBox 幅 680）
   * - "columns": セパレーター位置で上位/下位に分割し左右2列表示（viewBox 幅 960）
   */
  layout?: "single" | "columns";
  /**
   * X 軸の起点値。デフォルト: 0。"single" レイアウトのみ対応。
   * 例: 保険普及率のように最小値が 20% 付近の場合は 0 より大きい値を指定する。
   */
  xMin?: number;
  /**
   * X 軸・グリッド線・軸ラベルを描画するか。デフォルト: false。"single" レイアウトのみ対応。
   */
  showAxis?: boolean;
}

// ---------- 共通定数 ----------
const BAR_H = 18;
const ROW_H = 26;

// ---------- "single" レイアウト定数 ----------
const W = 680;          // viewBox 幅 = §5 横棒標準幅（1列）
const LABEL_X = 90;     // バー開始 X
const BAR_AREA_W = 550; // バー最大幅
const SEPARATOR_H = 20; // 区切り行の高さ

// ---------- "columns" レイアウト定数 ----------
const COLS_W = 960;          // viewBox 幅（2列）
const COL_R_OFFSET = 490;    // 右カラムの X オフセット
const COL_LABEL_X = 90;      // 各カラム内のバー開始 X（カラム相対）
const COL_BAR_AREA_W = 355;  // 各カラムのバー最大幅

/** "columns" レイアウトのレンダリング */
function renderColumnsLayout(
  topItems: BarItem[],
  bottomItems: BarItem[],
  options: BarChartOptions,
): string {
  const {
    title,
    subtitle,
    unit,
    ariaLabel = title,
    palette = "red",
    colorFn,
  } = options;

  // 両カラム共通スケール（上位・下位のうち大きい方に合わせる）
  const allValues = [...topItems, ...bottomItems].map((d) => d.value);
  const maxVal = Math.max(...allValues, 1);
  const { max: scaleMax } = niceScale(maxVal);
  const toBarW = (v: number) => Math.max(0, Math.round((v / scaleMax) * COL_BAR_AREA_W));

  // 右カラムのパレット（左の補色）
  const rightPalette: PaletteName = palette === "blue" ? "red" : "blue";
  const getLeftColor = colorFn ?? ((i: number) => colorByIndex(PALETTES[palette], i));
  const getRightColor = (i: number) => colorByIndex(PALETTES[rightPalette], i);

  const N = Math.max(topItems.length, bottomItems.length);
  const FIRST_BAR_Y = 44; // タイトル + カラムヘッダー分
  const totalH = FIRST_BAR_Y + N * ROW_H + 8;

  // 左カラム（上位）
  const leftRows = topItems.map((d, i) => {
    const y = FIRST_BAR_Y + i * ROW_H;
    const w = toBarW(d.value);
    const fill = getLeftColor(i);
    const midY = y + 13;
    return [
      `  <rect x="${COL_LABEL_X}" y="${y}" width="${w}" height="${BAR_H}" fill="${fill}" rx="2"/>`,
      `  <text x="${COL_LABEL_X - 5}" y="${midY}" text-anchor="end" font-size="12" class="svg-axis">${d.label}</text>`,
      `  <text x="${COL_LABEL_X + w + 4}" y="${midY}" font-size="12" class="svg-tick" font-weight="bold">${formatTick(d.value, 1)}</text>`,
    ].join("\n");
  });

  // 右カラム（下位）
  const rightRows = bottomItems.map((d, i) => {
    const x0 = COL_R_OFFSET;
    const y = FIRST_BAR_Y + i * ROW_H;
    const w = toBarW(d.value);
    const fill = getRightColor(i);
    const midY = y + 13;
    return [
      `  <rect x="${x0 + COL_LABEL_X}" y="${y}" width="${w}" height="${BAR_H}" fill="${fill}" rx="2"/>`,
      `  <text x="${x0 + COL_LABEL_X - 5}" y="${midY}" text-anchor="end" font-size="12" class="svg-axis">${d.label}</text>`,
      `  <text x="${x0 + COL_LABEL_X + w + 4}" y="${midY}" font-size="12" class="svg-tick" font-weight="bold">${formatTick(d.value, 1)}</text>`,
    ].join("\n");
  });

  const colHeaderY = 38;
  const leftCenterX = COL_LABEL_X + COL_BAR_AREA_W / 2;
  const rightCenterX = COL_R_OFFSET + COL_LABEL_X + COL_BAR_AREA_W / 2;
  const sepX = COL_R_OFFSET - 10;

  const titleText = subtitle
    ? `${title}<tspan font-size="10" font-weight="normal" class="svg-tick">　${subtitle}</tspan>`
    : title;

  return `<svg width="${COLS_W}" height="${totalH}" viewBox="0 0 ${COLS_W} ${totalH}" xmlns="http://www.w3.org/2000/svg" font-family="${FONT_FAMILY}" role="img" aria-label="${ariaLabel}">
${svgThemeStyle()}
  <rect width="${COLS_W}" height="${totalH}" class="svg-bg" rx="6"/>
  <text x="${COLS_W / 2}" y="22" text-anchor="middle" font-size="14" font-weight="bold" class="svg-title">${titleText}</text>
  <text x="${leftCenterX}" y="${colHeaderY}" text-anchor="middle" font-size="11" class="svg-axis">上位 ${topItems.length} 件（${unit}）</text>
  <text x="${rightCenterX}" y="${colHeaderY}" text-anchor="middle" font-size="11" class="svg-axis">下位 ${bottomItems.length} 件（${unit}）</text>
  <line x1="${sepX}" y1="28" x2="${sepX}" y2="${totalH - 8}" class="svg-grid" stroke-width="1"/>
${leftRows.join("\n")}
${rightRows.join("\n")}
</svg>`;
}

/**
 * 横棒グラフ SVG を生成する
 */
export function generateBarChartSvg(items: BarItem[], options: BarChartOptions): string {
  const layout = options.layout ?? "single";

  // ---------- "columns" レイアウト ----------
  if (layout === "columns") {
    const sepIdx = items.findIndex((d) => d.isSeparator);
    const topItems = sepIdx >= 0 ? items.slice(0, sepIdx) : items.slice(0, Math.ceil(items.length / 2));
    const bottomItems = sepIdx >= 0 ? items.slice(sepIdx + 1) : items.slice(Math.ceil(items.length / 2));
    return renderColumnsLayout(topItems, bottomItems, options);
  }

  // ---------- "single" レイアウト ----------
  const {
    title,
    subtitle,
    unit,
    ariaLabel = title,
    palette = "red",
    colorFn,
    xMin = 0,
    showAxis = false,
  } = options;

  const firstY = 36;

  const dataItems = items.filter((d) => !d.isSeparator);
  const maxVal = Math.max(...dataItems.map((d) => d.value), xMin + 1);
  const { max: scaleMax, step } = niceScale(maxVal - xMin);

  const toBarWidth = (v: number) => ((v - xMin) / scaleMax) * BAR_AREA_W;

  const getColor = colorFn ?? ((i: number) => colorByIndex(PALETTES[palette], i));

  const rowHeights = items.map((d) => (d.isSeparator ? SEPARATOR_H : ROW_H));

  const rowYs = items.map((_, i) => {
    let y = firstY;
    for (let j = 0; j < i; j++) y += rowHeights[j];
    return y;
  });

  const lastRowY = rowYs[rowYs.length - 1] ?? firstY;
  const lastRowH = rowHeights[rowHeights.length - 1] ?? ROW_H;
  const barsBottom = lastRowY + lastRowH;
  const totalH = barsBottom + (showAxis ? 38 : 8);

  const gridLines: string[] = [];
  if (showAxis) {
    gridLines.push(
      `  <line x1="${LABEL_X}" y1="${firstY}" x2="${LABEL_X}" y2="${barsBottom}" class="svg-grid" stroke-width="1"/>`,
    );
    for (let v = step; v <= scaleMax + step * 0.01; v += step) {
      const dataVal = xMin + v;
      const x = (LABEL_X + toBarWidth(dataVal)).toFixed(0);
      gridLines.push(
        `  <line x1="${x}" y1="${firstY}" x2="${x}" y2="${barsBottom}" class="svg-grid" stroke-width="1" stroke-dasharray="4,3"/>`,
        `  <text x="${x}" y="${(barsBottom + 13).toFixed(0)}" text-anchor="middle" font-size="10" class="svg-tick">${formatTick(dataVal, 1)}</text>`,
      );
    }
  }

  let barIndex = 0;
  const rows: string[] = items.map((d, i) => {
    const y = rowYs[i];

    if (d.isSeparator) {
      const midY = y + SEPARATOR_H / 2;
      return [
        `  <line x1="${LABEL_X}" y1="${midY}" x2="${LABEL_X + BAR_AREA_W}" y2="${midY}" class="svg-grid" stroke-width="1" stroke-dasharray="4 3"/>`,
        `  <text x="${LABEL_X + BAR_AREA_W / 2}" y="${midY + 4}" text-anchor="middle" font-size="9" class="svg-tick">…中略…</text>`,
      ].join("\n");
    }

    const idx = barIndex++;
    const w = Math.max(0, Math.round(toBarWidth(d.value)));
    const fill = getColor(idx);
    const midY = y + 13;
    const valX = LABEL_X + w + 4;
    const valStr = formatTick(d.value, 1);
    return [
      `  <rect x="${LABEL_X}" y="${y}" width="${w}" height="${BAR_H}" fill="${fill}" rx="2"/>`,
      `  <text x="${LABEL_X - 5}" y="${midY}" text-anchor="end" font-size="12" class="svg-axis">${d.label}</text>`,
      `  <text x="${valX}" y="${midY}" font-size="12" class="svg-tick" font-weight="bold">${valStr}</text>`,
    ].join("\n");
  });

  const titleText = subtitle
    ? `${title}<tspan font-size="10" font-weight="normal" class="svg-tick">　${subtitle}</tspan>`
    : title;

  return `<svg width="${W}" height="${totalH}" viewBox="0 0 ${W} ${totalH}" xmlns="http://www.w3.org/2000/svg" font-family="${FONT_FAMILY}" role="img" aria-label="${ariaLabel}">
${svgThemeStyle()}
  <rect width="${W}" height="${totalH}" class="svg-bg" rx="6"/>
  <text x="${W / 2}" y="22" text-anchor="middle" font-size="14" font-weight="bold" class="svg-title">${titleText}</text>
${gridLines.join("\n")}${showAxis ? `\n  <!-- 軸ラベル -->\n  <text x="${W / 2}" y="${totalH - 4}" text-anchor="middle" font-size="10" class="svg-tick">${unit}</text>` : ""}
${rows.join("\n")}
</svg>`;
}
