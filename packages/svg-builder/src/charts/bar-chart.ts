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
  /** 表示ラベル（例: "1位 徳島"）。"columns" では name 未指定時のフォールバック。 */
  label: string;
  /** 数値 */
  value: number;
  /**
   * true のとき、バーを描画せず破線と「…中略…」を表示する区切り行にする（"single" レイアウト）、
   * または "columns" レイアウトで左右の分割点として使用する。
   */
  isSeparator?: boolean;
  /** "columns" レイアウト用: 順位（バッジに表示）。未指定時はカラム内の連番。 */
  rank?: number;
  /** "columns" レイアウト用: 都道府県名など（カードに表示）。未指定時は label。 */
  name?: string;
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
   * - "columns": セパレーター位置で上位/下位に分割しカード型2列表示（viewBox 幅 960）
   */
  layout?: "single" | "columns";
  /** "columns" 右カラム（下位/少ない側）のカラーテーマ。デフォルト "blue"。 */
  rightPalette?: PaletteName;
  /** "columns" 左カラムのヘッダーラベル。デフォルト "上位"。 */
  highLabel?: string;
  /** "columns" 右カラムのヘッダーラベル。デフォルト "下位"。 */
  lowLabel?: string;
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

// ---------- "columns"（カード型2列ランキング）レイアウト定数 ----------
const COLS_W = 960;        // viewBox 幅（2列）
const COL_L_X = 30;        // 左カラムの絶対 X
const COL_R_X = 498;       // 右カラムの絶対 X
const CARD_W = 432;        // カード幅
const CARD_H = 44;         // カード高さ
const ROW_GAP = 44;        // 行間隔
const FIRST_ROW_Y = 124;   // 1 行目カードの上端 Y
const HEADER_Y = 80;       // カラムヘッダーバーの Y
const HEADER_H = 40;       // カラムヘッダーバーの高さ
const BADGE_DX = 30;       // 順位バッジ中心の X オフセット（カラム相対）
const BADGE_R = 14;        // 順位バッジ半径
const NAME_DX = 54;        // 県名の X オフセット
const VALUE_DX = 199.68;   // 値テキスト右端の X オフセット
const BAR_DX = 211.68;     // 値バー開始の X オフセット
const BAR_H_CARD = 14;     // 値バーの高さ
const CARD_BAR_AREA_W = 200; // 値バー最大幅
const BOTTOM_PAD = 60;     // 末尾余白

/** カード型2列ランキングのカラーテーマ（header=濃 / bar=中 / cardAlt=極薄背景） */
interface CardTheme {
  header: string;
  bar: string;
  cardAlt: string;
  badgeText: string;
}
const CARD_THEMES: Record<PaletteName, CardTheme> = {
  red:    { header: "#dc2626", bar: "#ef4444", cardAlt: "#fef2f2", badgeText: "#dc2626" },
  blue:   { header: "#1565c0", bar: "#42a5f5", cardAlt: "#eff6ff", badgeText: "#1565c0" },
  orange: { header: "#e65100", bar: "#fb8c00", cardAlt: "#fff3e0", badgeText: "#e65100" },
  green:  { header: "#2e7d32", bar: "#66bb6a", cardAlt: "#e8f5e9", badgeText: "#2e7d32" },
  purple: { header: "#7b1fa2", bar: "#ab47bc", cardAlt: "#f3e5f5", badgeText: "#7b1fa2" },
};

/** カラム1本分の行 SVG を生成 */
function renderCardColumn(
  items: BarItem[],
  colX: number,
  theme: CardTheme,
  headerLabel: string,
  toBarW: (v: number) => number,
  unit: string,
): string {
  const header = [
    `  <rect x="${colX}" y="${HEADER_Y}" width="${CARD_W}" height="${HEADER_H}" rx="8" fill="${theme.header}"/>`,
    `  <text x="${colX + CARD_W / 2}" y="${HEADER_Y + 26}" text-anchor="middle" font-size="14" font-weight="bold" fill="#ffffff">${headerLabel}</text>`,
  ].join("\n");

  const rows = items
    .map((d, i) => {
      const rowY = FIRST_ROW_Y + i * ROW_GAP;
      const cardBg = i % 2 === 0 ? theme.cardAlt : "#ffffff";
      const cy = rowY + 22;
      const w = toBarW(d.value);
      const rank = d.rank ?? i + 1;
      const name = d.name ?? d.label;
      const valStr = `${formatTick(d.value, 1)}${unit}`;
      return [
        `  <rect x="${colX}" y="${rowY}" width="${CARD_W}" height="${CARD_H}" rx="6" fill="${cardBg}"/>`,
        `  <circle cx="${colX + BADGE_DX}" cy="${cy}" r="${BADGE_R}" fill="${theme.header}"/>`,
        `  <text x="${colX + BADGE_DX}" y="${cy + 4.3}" text-anchor="middle" font-size="12" font-weight="bold" fill="#ffffff">${rank}</text>`,
        `  <text x="${colX + NAME_DX}" y="${cy + 4.7}" font-size="13" font-weight="bold" fill="#1f2937">${name}</text>`,
        `  <text x="${colX + VALUE_DX}" y="${cy + 4.3}" text-anchor="end" font-size="12" font-weight="600" fill="${theme.badgeText}">${valStr}</text>`,
        `  <rect x="${colX + BAR_DX}" y="${rowY + 15}" width="${w}" height="${BAR_H_CARD}" rx="4" fill="${theme.bar}" opacity="0.8"/>`,
      ].join("\n");
    })
    .join("\n");

  return `${header}\n${rows}`;
}

/** "columns"（カード型2列ランキング）レイアウトのレンダリング */
function renderColumnsLayout(
  topItems: BarItem[],
  bottomItems: BarItem[],
  options: BarChartOptions,
): string {
  const {
    title,
    subtitle,
    unit = "",
    ariaLabel = title,
    palette = "red",
    rightPalette = "blue",
    highLabel = "上位",
    lowLabel = "下位",
  } = options;

  const leftTheme = CARD_THEMES[palette] ?? CARD_THEMES.red;
  const rightTheme = CARD_THEMES[rightPalette] ?? CARD_THEMES.blue;

  // 両カラム共通スケール（全件の最大値を基準にバー長を決める）
  const allValues = [...topItems, ...bottomItems].map((d) => d.value);
  const globalMax = Math.max(...allValues, 1);
  const toBarW = (v: number) =>
    Math.max(0, Math.round((Math.max(0, v) / globalMax) * CARD_BAR_AREA_W * 1000) / 1000);

  const N = Math.max(topItems.length, bottomItems.length);
  const totalH = FIRST_ROW_Y + N * ROW_GAP + BOTTOM_PAD;

  const leftCol = renderCardColumn(topItems, COL_L_X, leftTheme, highLabel, toBarW, unit);
  const rightCol = renderCardColumn(bottomItems, COL_R_X, rightTheme, lowLabel, toBarW, unit);

  const titleText = subtitle
    ? `${title}<tspan font-size="11" font-weight="normal" class="svg-tick">　${subtitle}</tspan>`
    : title;

  return `<svg width="${COLS_W}" height="${totalH}" viewBox="0 0 ${COLS_W} ${totalH}" xmlns="http://www.w3.org/2000/svg" font-family="${FONT_FAMILY}" role="img" aria-label="${ariaLabel}">
${svgThemeStyle()}
  <rect width="${COLS_W}" height="${totalH}" class="svg-bg"/>
  <text x="${COLS_W / 2}" y="40" text-anchor="middle" font-size="18" font-weight="bold" class="svg-title">${titleText}</text>
${leftCol}
${rightCol}
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
